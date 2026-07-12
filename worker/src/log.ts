/* eslint-disable no-console */

type LogFields = Record<string, null | number | string | undefined>;

export const logInfo = (event: string, fields: LogFields): void => {
  console.log({ event, ...fields });
};

export const logError = (event: string, fields: LogFields): void => {
  console.error({ event, ...fields });
};
