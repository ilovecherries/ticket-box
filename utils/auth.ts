import { Response } from "express"

export async function qAuthCheck(
	res: Response,
	cont: any,
	callback: () => Promise<void>,
	failCallback?: () => Promise<void>,
) {
	if (cont) await callback();
	else if (failCallback) await failCallback();
	else {
		res.status(401);
		res.send("You are not authorized to do this action.")
	}
}