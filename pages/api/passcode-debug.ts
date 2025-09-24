// pages/api/passcode-debug.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // DO NOT expose values; just presence and length for diagnostics
  const admin = process.env.ADMIN_PASS || ''
  const editor = process.env.EDITOR_PASS || ''
  const info = {
    runtime: 'node',
    hasAdmin: !!admin,
    hasEditor: !!editor,
    adminLength: admin.length,
    editorLength: editor.length,
  }
  return res.status(200).json(info)
}
