import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

function isUserCancel(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /cancel|dismiss|aborted/i.test(message);
}

export async function presentBillPdf(html: string, title: string) {
  const file = await Print.printToFileAsync({ html });

  try {
    if (Platform.OS === 'ios') {
      await Print.printAsync({ uri: file.uri });
      return file.uri;
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: title,
      });
      return file.uri;
    }

    await Print.printAsync({ html });
    return file.uri;
  } catch (error) {
    if (isUserCancel(error)) {
      return file.uri;
    }
    throw error;
  }
}
