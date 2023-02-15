import type {ContractPromise} from "@polkadot/api-contract";
import {handleEventReturn} from "@arthswap/typechain-types";

export function decodeEvents(events: any[], contract: ContractPromise, EVENT_TYPE: any): any[] {
	return events.filter((record: any) => {
		const { event } = record;

		const [address, data] = record.event.data;

		return event.method == 'ContractEmitted' && address.toString() === contract.address.toString();
	}).map((record: any) => {
		const [address, data] = record.event.data;

		const {args, event} = contract.abi.decodeEvent(data);

		const _event: Record < string, any > = {};

		for (let i = 0; i < args.length; i++) {
			_event[event.args[i]!.name] = args[i]!.toJSON();
		}

		handleEventReturn(_event, EVENT_TYPE[event.identifier.toString()]);

		return {
			name: event.identifier.toString(),
			args: _event,
		};
	});
}
