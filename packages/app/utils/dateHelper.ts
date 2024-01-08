export const CommentsTime = (dateString: string) => {
  const date: Date = new Date(dateString);
  const currentDate: Date = new Date();
  // @ts-expect-error -> TS doesn't allow arithematic operation on 'date' type
  const timeDifference = currentDate - date;
  const secondsAgo = Math.floor(timeDifference / 1000);
  const minutesAgo = Math.floor(secondsAgo / 60);
  const hoursAgo = Math.floor(minutesAgo / 60);
  const daysAgo = Math.floor(hoursAgo / 24);
  const monthsAgo = Math.floor(daysAgo / 30);
  const yearsAgo = Math.floor(monthsAgo / 12);

  if (yearsAgo > 0) {
    return `${yearsAgo} year ago`;
  } else if (monthsAgo > 0) {
    return `${monthsAgo} mon ago`;
  } else if (daysAgo > 0) {
    return `${daysAgo} day ago`;
  } else if (hoursAgo > 0) {
    return `${hoursAgo} hour ago`;
  } else if (minutesAgo > 0) {
    return `${minutesAgo} min ago`;
  } else {
    return `${secondsAgo} sec ago`;
  }
};