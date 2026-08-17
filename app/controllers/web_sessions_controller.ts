import { errors } from '@adonisjs/auth'
import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class WebSessionsController {
  show({ view }: HttpContext) {
    return view.render('auth/login', { email: '', error: null })
  }

  async store(ctx: HttpContext) {
    const { request, auth, response } = ctx
    const [validationError, payload] = await loginValidator.tryValidate(request.all())

    if (validationError) {
      return this.renderInvalidCredentials(ctx)
    }

    try {
      const user = await User.verifyCredentials(payload.email, payload.password)
      await auth.use('web').login(user)
    } catch (error) {
      if (!(error instanceof errors.E_INVALID_CREDENTIALS)) throw error
      return this.renderInvalidCredentials(ctx)
    }

    return response.redirect().toIntended('/account')
  }

  account({ auth, view }: HttpContext) {
    return view.render('auth/account', { user: auth.getUserOrFail() })
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toPath('/login')
  }

  private renderInvalidCredentials({ request, response, view }: HttpContext) {
    response.status(422)
    return view.render('auth/login', {
      email: request.input('email', ''),
      error: 'Invalid email or password',
    })
  }
}
