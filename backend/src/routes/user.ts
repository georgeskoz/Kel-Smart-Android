import { Hono } from "hono";

const userRouter = new Hono();

userRouter.get("/", (c) => {
  const name = c.req.query("name") ?? "User";

  return c.json({
    data: {
      user: name,
      accessLevel: "authorized",
      capacity: {
        maxSensors: 99,
      },
    },
  });
});

export { userRouter };
