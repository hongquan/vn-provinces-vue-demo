
import { string, number, array, record, object, size, optional, defaulted, assign, mask, Infer } from 'superstruct'

export const SearchMatches = record(string(), size(array(number()), 2))

export const BaseSchema = object({
  code: number(),
  name: string(),
  matches: optional(SearchMatches)
})

export const WardSchema = BaseSchema

export const DistrictShema = assign(BaseSchema, object({
  wards: defaulted(array(WardSchema), [])
}))

export const ProvinceSchema = assign(BaseSchema, object({
  districts: defaulted(array(DistrictShema), [])
}))

export type Base = Infer<typeof BaseSchema>
export type Ward = Infer<typeof WardSchema>
export type District = Infer<typeof DistrictShema>
export type Province = Infer<typeof ProvinceSchema>
