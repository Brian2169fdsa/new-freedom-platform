/**
 * Returns a moderation report id for a given content id and reporter id.
 *
 * @param {string} contentId - The id of the content.
 * @param {string} reporterId - The id of the reporter.
 * @return {string} The id of the moderation report.
 */
export const getModerationReportId = (
  contentId: string,
  reporterId: string
) => {
  return contentId + "_" + reporterId;
};
