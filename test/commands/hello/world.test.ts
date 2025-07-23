import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('help', () => {
  it('shows help output', async () => {
    const {stdout} = await runCommand('--help')
    expect(stdout).to.contain('USAGE')
  })
})
