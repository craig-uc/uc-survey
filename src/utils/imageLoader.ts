export const loadAccountImage = (account: string, imageName: string): Promise<{ default: string }> =>
  import(`../app/assets/images/${account}/${imageName}`);

export const loadDarkImage = (imageName: string): Promise<{ default: string }> =>
  import(`../app/assets/images/dark/${imageName}`);
