import { z } from 'zod'

import { pointerTypes } from './types.js'

export const pointerTypeSchema = z.enum(pointerTypes)
