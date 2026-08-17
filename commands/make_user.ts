import User from '#models/user'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class MakeUser extends BaseCommand {
  static commandName = 'make:user'
  static description = ''

  static options: CommandOptions = { startApp: true }

  async run() {
    try {
      const email = await this.prompt.ask('Enter the user email')
      const password = await this.prompt.secure('Enter the user password (min 8 characters)', {
        validate: (value) => {
          if (typeof value !== 'string' || value.length < 8) {
            return 'Password must be at least 8 characters long'
          }
          return true
        },
      })
      const firstName = await this.prompt.ask('Enter the user first name (optional)')
      const lastName = await this.prompt.ask('Enter the user last name (optional)')

      const user = await User.create({
        email,
        password,
        firstName: firstName || null,
        lastName: lastName || null,
      })

      this.logger.info(`User created: ${user.email}`)
    } catch (e) {
      if (e instanceof Error) this.logger.error(e.message)
      this.logger.error('Failed to create user')
    }
  }
}
