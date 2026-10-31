import { createConsumer } from '@rails/actioncable'

import { env } from '@/shared/config/env'

export const cable = createConsumer(env.cableUrl)
