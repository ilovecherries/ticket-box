import { PrismaClient, User } from "@prisma/client";
import { Strategy } from "passport-local";
import jwtStrategy, { ExtractJwt } from "passport-jwt";

const prisma = new PrismaClient();

export type UserView = {
  id: number,
  username: string,
  admin: boolean,
};

declare global {
  namespace Express {
    interface User {
      id: number,
      username: string,
      admin: boolean,
    }
  }
}

export type UserCredentials = {
  username: string,
  password: string,
};

export class UserService {
  public strategy: string = "local";

  private toView(user: User): UserView {
    const data: UserView = {
      id: user.id,
      username: user.username,
      admin: user.admin,
    };
    return data;
  }

  async register(username: string, password: string): Promise<UserView> {
    const data = await prisma.user.create({
      data: { username, password },
    });
    return this.toView(data);
  }

  async getById(id: number): Promise<UserView> {
    const data = await prisma.user.findUnique({
      where: { id },
    });
    if (data) {
      return this.toView(data);
    } else {
      throw new Error("Could not find the user with this id.");
    }
  }

  async getByUsername(username: string): Promise<UserView> {
    const data = await prisma.user.findUnique({
      where: { username },
    });
    if (data) {
      return this.toView(data);
    } else {
      throw new Error("Could not find the user with this id.");
    }
  }

  async deleteById(id: number) {
    await prisma.user.delete({
      where: { id },
    });
  }

  async deleteByUsername(username: string) {
    await prisma.user.delete({
      where: { username },
    });
  }

  async setAdmin(id: number, admin: boolean) {
    await prisma.user.update({
      data: { admin },
      where: { id },
    });
  }

  registerStrategy(): Strategy {
    return new Strategy(async (username, password, done) => {
      try {          
        const user = await this.register(username, password);
        done(null, user);
      } catch (e) {
        console.error(e);
        done(e);
      }
    })
  }

  loginStrategy(): Strategy {
    return new Strategy(async (username, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { username }
        });
        if (user && user.password === password) {
          done(null, this.toView(user))
        } else {
          done(null, false)
        }
      } catch (e) {
        console.error(e);
        done(e);
      }
    })
  }

  jwtStrategy(): jwtStrategy.Strategy {
    return new jwtStrategy.Strategy(
      {
        secretOrKey: "TOP_SECRET",
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      },
      (token, done) => {
        try {
          return done(null, token.user);
        } catch (error) {
          done(error);
        } 
      }
    )
  }
}
