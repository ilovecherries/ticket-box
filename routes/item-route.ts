import { Router } from "express";
import { Checker } from "ts-interface-checker";
import { IItemService } from "../services/IItemService";
import { UserService } from "../services/user";
import { qAuthCheck } from "../utils/auth";

export function generateItemRoute<T, U, V>(
	service: IItemService<T, U, V>,
	propsChecker: Checker,
	editPropsChecker: Checker
): Router {
	const router = Router();

	const userService = new UserService();

	router.get("/", async (_, res) => {
		try {
			res.json(await service.getAll());
		} catch (e) {
			res.status(500);
		}
	})

	router.get("/:id([0-9]+)", async (req, res) => {
		try {
			const id = parseInt(req.params.id);
			res.json(await service.getOne(id));
		} catch (e) {
			res.status(500);
			res.send(e);
		}
	});

	router.post("/", async (req, res) => {
		await qAuthCheck(res, req.user, async () => {
			try {
				const user = await userService.getById(req.user!.id);
				await qAuthCheck(res, user.admin, async () => {
					const { body } = req;
					propsChecker.check(body);
					const item = await service.create(body);
					res.status(201);
					res.json(item);
				})
			} catch (e) {
				res.status(400);
				res.send(e);
			}
		});
	});

	router.put("/:id([0-9]+)", async (req, res) => {
		await qAuthCheck(res, req.user, async () => {
			try {
				const user = await userService.getById(req.user!.id);
				await qAuthCheck(res, user.admin, async () => {
					const id = parseInt(req.params.id);
					const { body } = req;
					editPropsChecker.check(body);
					const item = await service.edit(id, body);
					res.json(item);
				})
			} catch (e) {
				res.status(400);
				res.send(e);
			}
		});
	});

	router.delete("/:id([0-9]+)", async (req, res) => {
		await qAuthCheck(res, req.user, async () => {
			try {
				const user = await userService.getById(req.user!.id);
				await qAuthCheck(res, user.admin, async () => {
					const id = parseInt(req.params.id);
					await service.delete(id);
					res.status(204);
					res.json();
				})
			} catch (e) {
				res.status(400);
				res.send(e);
			}
		});
	});

	return router;
}

export default generateItemRoute;