import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('version', () => {
  it('shows the version number', async () => {
    const {stdout} = await runCommand('--version')
    expect(stdout).to.match(/\d+\.\d+\.\d+/)
  })
})
