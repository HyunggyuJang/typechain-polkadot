import BN from 'bn.js';
import type { ContractExecResultResult } from '@polkadot/types/interfaces/contracts/types';
import type { AnyJson } from "@polkadot/types-codec/types";
import { WeightV2 } from "@polkadot/types/interfaces";
type DispatchError = ContractExecResultResult['asErr'];
export type RequestArgumentType = number | string | boolean | bigint | (string | number)[] | BN | null | AnyJson | Object;
export interface GasLimit {
    /**
     * Defaults to `-1`
     */
    gasLimit?: WeightV2 | null;
}
export interface GasLimitAndValue extends GasLimit {
    /**
     * Only required for 'payable' methods
     * Defaults to `0`
     */
    value?: bigint | BN | string | number;
}
export interface GasLimitAndRequiredValue extends GasLimit {
    /**
     * Only required for 'payable' methods
     * Defaults to `0`
     */
    value: bigint | BN | string | number;
}
export interface ConstructorOptions extends GasLimitAndValue {
    storageDepositLimit?: bigint | BN | string | number;
}
export interface ErrorWithTexts {
    texts?: string[];
}
export type MethodDoesntExistError = ErrorWithTexts & {
    issue: 'METHOD_DOESNT_EXIST';
};
export type QueryCallError = MethodDoesntExistError | ErrorWithTexts & ({
    issue: 'FAIL_AT_CALL';
    caughtError: unknown;
} | {
    issue: 'FAIL_AFTER_CALL::IS_ERROR';
    _resultIsOk: boolean;
    _asError?: DispatchError;
} | {
    issue: 'FAIL_AFTER_CALL::RESULT_NOT_OK';
    _asError?: DispatchError;
} | {
    issue: 'OUTPUT_IS_NULL';
});
export type QueryOkCallError = QueryCallError | {
    issue: 'READ_ERR_IN_BODY';
    _err: any;
} | {
    issue: 'BODY_ISNT_OKERR';
    value: any;
};
export declare class Result<T, E> {
    constructor(ok?: T, err?: E);
    ok?: T;
    err?: E;
    unwrap(): T;
    unwrapRecursively(): T;
}
export declare class ResultBuilder {
    static Ok<T, E>(value: T): Result<T, E>;
    static Err<T, E>(error: E): Result<T, E>;
}
export declare class ReturnNumber {
    readonly rawNumber: BN;
    constructor(value: number | string);
    toString(): string;
    toHuman(): string;
    toNumber(): number;
    toBigInt(): bigint;
    static ToBN(value: number | string): BN;
}
export interface ReturnedEvent {
    name: string;
    args: Record<string, AnyJson>;
}
export {};
//# sourceMappingURL=types.d.ts.map