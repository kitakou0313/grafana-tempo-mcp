import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createDefaultEsmPreset({
  //...options
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
}

export default jestConfig

