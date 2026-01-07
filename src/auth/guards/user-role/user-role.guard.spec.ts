import { UserRoleGuard } from './user-role.guard';

describe.skip('UserRoleGuard', () => {
  it('should be defined', () => {
    expect(new UserRoleGuard({} as any)).toBeDefined();
  });
});
