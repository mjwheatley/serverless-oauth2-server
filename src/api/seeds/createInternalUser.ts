import { User } from "../src/infrastructure/models/User";
import { IUserDataObject, UserRepository } from "../src/infrastructure/repositories/UserRepository";

describe("User.createInternalUser", function () {
    it("should create a new internal user", function () {
        const user = User.createInternalUser({
            username: `username@localhost`,
            password: `password1!`,
            profile: {
                name: `user name`,
                givenName: `user`,
                familyName: `name`,
                emailAddress: `username@localhost`,
                emailVerified: false
            }
        });
        const userRepository: UserRepository = new UserRepository();
        const userDataObject: IUserDataObject = userRepository.toDataObject(user);
        console.log(`user`, JSON.stringify(userDataObject));
    });
});



