import * as mainWindow from './windows/main'
import { C } from 'deltachat-node'
import DeltaChatController from './deltachat/controller'
import { getLogger } from '../shared/logger'
const log = getLogger('main/markseenfix')

let dc: DeltaChatController

export async function maybeMarkSeen(chatId: number, msgId: number) {
  if (!dc) {
    return
  }
  if (!mainWindow.window.hidden) {
    const selectedChatId = await dc._callMethod('chatList.getSelectedChatId')
    if (selectedChatId === chatId) {
      await dc._callMethod('messageList.markSeenMessages', [msgId])
    }
  }
}

export function setupMarkseenFix(dcClass: DeltaChatController) {
  dc = dcClass
  dc.on('ready', _ => {
    mainWindow.window.on('focus', async () => {
      const selectedChatId = await dc._callMethod(
        'chatList.getSelectedChatId',
        []
      )
      const chat = await dc._callMethod('chatList.getFullChatById', [
        selectedChatId,
        true,
      ])
      if (!chat) return
      if (chat && chat.id > C.DC_CHAT_ID_LAST_SPECIAL) {
        if (chat.freshMessageCounter > 0) {
          await dc._callMethod('chat.markNoticedChat', [chat.id])
          const messagIds = (chat.messages || []).map((msg: any) => msg.id)
          log.debug('markSeenMessages', messagIds)
          await dc._callMethod('messageList.markSeenMessages', [messagIds])
        }
      }
    })
  })
}
