export const sleep = (minutes: number) => new Promise((r) => setTimeout(r, 1000 * 60 * minutes));

export default sleep;
