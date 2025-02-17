// Copyright (c) 2012-2022 Supercolony
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the"Software"),
// to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import type { ContractPromise } from "@polkadot/api-contract";
import type { DecodedEvent } from "@polkadot/api-contract/types";
import type {
	RequestArgumentType, GasLimitAndValue, MethodDoesntExistError,
} from './types';
import {
	_genValidGasLimitAndValue,
} from './query';
import type {
	SubmittableExtrinsic,
	SignerOptions,
} from '@polkadot/api/submittable/types';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { Registry } from '@polkadot/types-codec/types';
import type { ApiPromise } from "@polkadot/api";
import type { ContractSubmittableResult } from "@polkadot/api-contract/base/Contract";

type SignAndSendSuccessResponse = {
	wait: Promise<{ error?: string }>;
	from: string;
	txHash?: string;
	blockHash?: string;
	result?: ContractSubmittableResult;
	error?: {
		message?: any;
		data?: any;
	};
	events?: DecodedEvent[];
};

export type {
	SignAndSendSuccessResponse,
};

export async function txSignAndSend(
	nativeAPI: ApiPromise,
	nativeContract: ContractPromise,
	keyringPair: KeyringPair,
	title: string,
	args?: readonly RequestArgumentType[],
	gasLimitAndValue?: GasLimitAndValue,
	signerOptions?: Partial<SignerOptions>
) {
	const _gasLimitAndValue = await _genValidGasLimitAndValue(nativeAPI, gasLimitAndValue);

	const submittableExtrinsic = buildSubmittableExtrinsic(
		nativeAPI, nativeContract,
		title, args, _gasLimitAndValue,
	);
	return _signAndSend(nativeAPI.registry, submittableExtrinsic, keyringPair, signerOptions);
}

export function buildSubmittableExtrinsic(
	api: ApiPromise,
	nativeContract: ContractPromise,
	title: string,
	args?: readonly RequestArgumentType[],
	gasLimitAndValue?: GasLimitAndValue,
) {
	if (nativeContract.tx[title] == null) {
		const error: MethodDoesntExistError = {
			issue: 'METHOD_DOESNT_EXIST',
			texts: [`Method name: '${title}'`],
		};
		throw error;
	}

	const _args = args || [];

	const submittableExtrinsic = nativeContract.tx[title]!(
		gasLimitAndValue,
		..._args,
	);

	return submittableExtrinsic;
}

/**
 * (i) For reference, see:
 * 	- https://polkadot.js.org/docs/api/cookbook/tx#how-do-i-get-the-decoded-enum-for-an-extrinsicfailed-event
 * 	- `@redspot/patract/buildTx`
 */
export async function _signAndSend(
	registry: Registry,
	extrinsic: SubmittableExtrinsic<'promise'>,
	signer: KeyringPair,
	signerOptions?: Partial<SignerOptions>
): Promise<SignAndSendSuccessResponse> {
	const signerAddress = signer.address;
	let finalize: Function, finallyRejected: Function;
	const wait = new Promise<{ error?: string }>((resolve, reject) => {
		finalize = resolve;
		finallyRejected = reject;
	});
	let resolve: Function, reject: Function;
	const resultPromise = new Promise<SignAndSendSuccessResponse>((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});
	const actionStatus = {
		from: signerAddress.toString(),
		txHash: extrinsic.hash.toHex(),
	} as SignAndSendSuccessResponse;
	try {
		const unsub = await extrinsic
			.signAndSend(
				signerOptions ? signerAddress : signer,
				{ nonce: -1, ...signerOptions },
				(result: ContractSubmittableResult) => {
					if (result.status.isFinalized || result.status.isInBlock) {
						actionStatus.blockHash = result.status.isInBlock
							? result.status.asInBlock.toHex()
							: result.status.asFinalized.toHex();
						actionStatus.events = result.contractEvents;
						if (!result.isError && !result.dispatchError) {
							actionStatus.result = result;
							actionStatus.wait = wait;
							resolve(actionStatus);
							if (result.status.isFinalized) {
								finalize();
								unsub();
							}
						} else {
							let message = 'Transaction failed';

							if (result.dispatchError?.isModule) {
								const decoded = registry.findMetaError(result.dispatchError.asModule);
								message = `${decoded?.section.toUpperCase()}.${decoded?.method}: ${decoded?.docs}`;
								actionStatus.error = {
									message,
								};
								reject(actionStatus);
								finallyRejected({ error: message });
							}
						}
					}
				}
			);
	} catch (error) {
		actionStatus.error = {
			message: error.message,
		};
		reject(actionStatus);
	}
	return resultPromise;
}
