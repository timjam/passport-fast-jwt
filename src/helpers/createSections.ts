import { JwtSections } from "../strategy"

export const createSections = (
  sections?: JwtSections | JwtSections["payload"],
): JwtSections => {
  const alwaysCompleteShape: JwtSections = {
    header: sections?.header ?? {},
    payload: sections?.payload ?? sections,
    signature: sections?.signature ?? "",
    input: sections?.input ?? "",
  }

  if (!sections) {
    return {
      ...alwaysCompleteShape,
      payload: "",
    }
  }

  return alwaysCompleteShape
}
