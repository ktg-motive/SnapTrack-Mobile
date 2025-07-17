 WARN  [2025-07-04T02:10:06.280Z]  @firebase/auth: Auth (11.10.0): 
You are initializing Firebase Auth for React Native without providing
AsyncStorage. Auth state will default to memory persistence and will not
persist between sessions. In order to persist auth state, install the package
"@react-native-async-storage/async-storage" and provide it to
initializeAuth:

import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
 LOG  🔐 User signed out
 LOG  📡 Network reconnected, processing offline queue
 LOG  📡 Network reconnected, processing offline queue
 LOG  📡 Network reconnected, processing offline queue
 LOG  📱 No pending receipts to upload
 LOG  📱 No pending receipts to upload
 LOG  📱 No pending receipts to upload
 LOG  📡 Network reconnected, processing offline queue
 LOG  📱 No pending receipts to upload
[RemoteTextInput] -[RTIInputSystemClient remoteTextInputSessionWithID:performInputOperation:]
perform input operation requires a valid sessionID. inputModality = Keyboard, inputOperation =
<null selector>, customInfoType = UIEmojiSearchOperations
 LOG  🔐 User signed in: kai@motiveai.ai
 LOG  ✅ Google sign in successful
 LOG  📡 Network reconnected, processing offline queue
 LOG  📡 API Request: GET /api/expenses?limit=1000&_t=1751595011299
 LOG  📡 API Request: GET /api/expenses?limit=5&_t=1751595011300
 LOG  📱 No pending receipts to upload
 LOG  ✅ API Response: /api/expenses?limit=1000&_t=1751595011299 successful (478ms)
 LOG  [Performance] API_GET_/api/expenses?limit=1000&_t=1751595011299: 478ms {"endpoint": "/api/expenses?limit=1000&_t=1751595011299", "method": "GET", "statusCode": 200, "success": true}
 LOG  📊 Performance Metric: {"additionalData": {"endpoint": "/api/expenses?limit=1000&_t=1751595011299", "method": "GET", "statusCode": 200, "success": true}, "duration": 478, "id": "perf_1751595011781_6lodk4qvp", "metric": "API_GET_/api/expenses?limit=1000&_t=1751595011299", "timestamp": 1751595011786}
 LOG  🔄 Transforming expenses from backend format: {
  "ai_reasoning": "The original OCR correctly identified the vendor and its location, but incorrectly captured the date and final amount. The receipt confirms the transaction date as '03-Jul-2025.' The final amount, including tips, matches recorded amount of $11.02 rather than $9.02.",
  "ai_validated": true,
  "amount": 11.02,
  "amount_confidence": 95,
  "confidence_score": null,
  "currency": "USD",
  "date_created": "2025-07-04T01:25:12.590132+00:00",
  "description": null,
  "email_subject": null,
  "entity": "",
  "entity_confidence": 95,
  "entity_source": null,
  "expense_date": "2025-07-03",
  "expense_type": "personal",
  "extraction_method": "ai_corrected",
  "id": 289,
  "image_content_type": "image/png",
  "image_filename": "20250704_012502_0ef56673.jpg",
  "image_size": 1152073,
  "image_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_012502_0ef56673.jpg",
  "location": null,
  "notes": "Receipt from LATTE DA",
  "raw_ocr_text": "LATTE DA\n32 SOUTH SECTION STREET\nFAIRHOPE, AL 365322212\n2519285295\n03-Jul-2025 8 19:24A\nTransaction 100006\n1 Brewed Coffee\nIce Rage\n$0.00\nLarge $2.52\n$0.00\nRegular $5.50\nVanilla $0.00\nSubtotal\n$8.02\nSales Tax 9%\n9%\n$0.72\nNon Cash Adjustment (3.5%)\n$0.28\nTotal\n$9.02\nTip\n$2.00\nCREDIT CARD SALE\n$11.02\nAMEX 4131\nRetain this copy for statement validation\n03-Jul-2025 8:19:53A\n$11.02 Method: CONTACTLESS\nAMEX CREDIT XXXXXXXXXXXX4131\nReference ID: 518400731195\nAuth ID: 823700\nMID: ***********5962\nAID: A000000025010901\nOnline: https://clover.com/p\n/P1CV3XYM05R8Y\nClover ID: XORVAJH9K1RY8\nPayment P1CV3XYM05R8Y\nClover Privacy Policy\nhttps://clover.com/privacy",
  "receipt_filename": null,
  "tags": [],
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0",
  "updated_at": "2025-07-04T01:25:12.590132+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "validation_cost": 0.004,
  "validation_triggers": [
    "low_amount_confidence",
    "low_date_confidence"
  ],
  "vendor": "LATTE DA"
}
 LOG  🔄 Transformed expense: {
  "id": "289",
  "vendor": "LATTE DA",
  "amount": 11.02,
  "date": "2025-07-03",
  "entity": "",
  "tags": [],
  "notes": "Receipt from LATTE DA",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_012502_0ef56673.jpg",
  "created_at": "2025-07-04T01:25:12.590132+00:00",
  "updated_at": "2025-07-04T01:25:12.590132+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "259",
  "vendor": "LATTE DA",
  "amount": 11.02,
  "date": "2025-07-03",
  "entity": "Motive AI",
  "tags": [],
  "notes": "Coffee with Sebastian",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/03/20250703_153806_0341eca1.jpg",
  "created_at": "2025-07-03T15:38:15.142344+00:00",
  "updated_at": "2025-07-03T15:38:46.997715+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "283",
  "vendor": "Fairhope Social Club",
  "amount": 33.79,
  "date": "2025-07-03",
  "entity": "Motive AI",
  "tags": [],
  "notes": "Receipt from Fairhope Social Club",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/03/20250703_214113_2b89f0a3.jpg",
  "created_at": "2025-07-03T21:41:21.870761+00:00",
  "updated_at": "2025-07-03T21:41:21.870761+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "288",
  "vendor": "LATTE DA",
  "amount": 11.02,
  "date": "2025-07-03",
  "entity": "",
  "tags": [],
  "notes": "Receipt from LATTE DA",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_012419_3479c46a.jpg",
  "created_at": "2025-07-04T01:24:26.566726+00:00",
  "updated_at": "2025-07-04T01:24:26.566726+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "257",
  "vendor": "Bayside Academy",
  "amount": 2708.43,
  "date": "2025-07-03",
  "entity": "Personal",
  "tags": [
    "School"
  ],
  "notes": "Bayside",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/03/20250703_143859_b09b1439.jpg",
  "created_at": "2025-07-03T14:39:07.745391+00:00",
  "updated_at": "2025-07-03T14:39:38.518552+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "275",
  "vendor": "Ben's Jr. Bar-B-Que",
  "amount": 27.74,
  "date": "2025-07-03",
  "entity": "Motive AI",
  "tags": [],
  "notes": "Receipt from Ben's Jr. Bar-B-Que",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/03/20250703_194841_629d7830.jpg",
  "created_at": "2025-07-03T19:48:50.397954+00:00",
  "updated_at": "2025-07-03T19:48:50.397954+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "197",
  "vendor": "Red Or White Fairhope",
  "amount": 6.54,
  "date": "2025-07-01",
  "entity": "Personal",
  "tags": [
    "Meals"
  ],
  "notes": "Receipt from Red Or White Fairhope",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/01/20250701_231019_ef5a1e68.jpeg",
  "created_at": "2025-07-01T23:10:20.675801+00:00",
  "updated_at": "2025-07-02T20:42:38.480886+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "163",
  "vendor": "Los Tacos",
  "amount": 33.81,
  "date": "2025-06-30",
  "entity": "personal",
  "tags": [
    "food"
  ],
  "notes": "Receipt from Los Tacos",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/01/20250701_014116_aeac59d6.jpeg",
  "created_at": "2025-07-01T01:41:18.399953+00:00",
  "updated_at": "2025-07-01T02:28:02.09365+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "131",
  "vendor": "BOUCH'S PREMIUM CIGARS",
  "amount": 18.62,
  "date": "2025-06-30",
  "entity": "Personal",
  "tags": [
    "Cigars"
  ],
  "notes": "",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/06/30/20250630_141634_276dab41.jpeg",
  "created_at": "2025-06-30T14:16:36.050069+00:00",
  "updated_at": "2025-06-30T22:16:07.156332+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "151",
  "vendor": "Mary Ann's Deli",
  "amount": 20.28,
  "date": "2025-06-30",
  "entity": "Personal",
  "tags": [
    "meals"
  ],
  "notes": "",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/06/30/20250630_193649_b028728f.jpeg",
  "created_at": "2025-06-30T19:36:52.221154+00:00",
  "updated_at": "2025-06-30T20:45:44.927751+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "229",
  "vendor": "Greer's Market",
  "amount": 34.84,
  "date": "2025-06-28",
  "entity": "personal",
  "tags": [
    "food"
  ],
  "notes": "Receipt from Greer's",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/02/20250702_224039_b0be32ca.jpeg",
  "created_at": "2025-07-02T22:40:49.184045+00:00",
  "updated_at": "2025-07-02T22:41:22.715091+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "226",
  "vendor": "Walmart",
  "amount": 25,
  "date": "2025-06-28",
  "entity": "Motive AI",
  "tags": [
    "receipt"
  ],
  "notes": "Receipt from Walmart",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/02/20250702_200450_28c97f97.jpg",
  "created_at": "2025-07-02T20:05:05.050656+00:00",
  "updated_at": "2025-07-02T20:05:05.050656+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "255",
  "vendor": "Greer's",
  "amount": 34.84,
  "date": "2025-06-28",
  "entity": "",
  "tags": [],
  "notes": "Receipt from Greer's",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/03/20250703_054716_331a7287.jpg",
  "created_at": "2025-07-03T05:47:25.765867+00:00",
  "updated_at": "2025-07-03T05:47:25.765867+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "23",
  "vendor": "Greer's Market",
  "amount": 55.17,
  "date": "2025-06-28",
  "entity": "LA-AI",
  "tags": [
    "Meetup, Food"
  ],
  "notes": "",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/06/28/20250628_142623_d6d7e3cb.png",
  "created_at": "2025-06-28T14:26:24.653591+00:00",
  "updated_at": "2025-06-30T22:20:13.443374+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "115",
  "vendor": "Conecuh Sausage",
  "amount": 10.95,
  "date": "2025-06-27",
  "entity": "Motive AI",
  "tags": [
    "Sloss Tech Conference"
  ],
  "notes": "",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/06/30/20250630_041306_7e5b6e9b.jpeg",
  "created_at": "2025-06-30T04:13:08.018693+00:00",
  "updated_at": "2025-06-30T22:20:08.110657+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "302",
  "vendor": "The Tack Room",
  "amount": 124.53,
  "date": "2024-04-08",
  "entity": "",
  "tags": [],
  "notes": "Receipt from The Tack Room",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_020543_e8002055.jpg",
  "created_at": "2025-07-04T02:05:51.017842+00:00",
  "updated_at": "2025-07-04T02:05:51.017842+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "291",
  "vendor": "The Tack Room",
  "amount": 124.53,
  "date": "2024-04-08",
  "entity": "Motive AI",
  "tags": [],
  "notes": "Receipt from The Tack Room",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_015523_e4d685da.jpg",
  "created_at": "2025-07-04T01:55:30.593823+00:00",
  "updated_at": "2025-07-04T01:55:30.593823+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "292",
  "vendor": "The Tack Room",
  "amount": 124.53,
  "date": "2024-04-08",
  "entity": "Motive AI",
  "tags": [],
  "notes": "Receipt from The Tack Room",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_015533_a2740fbc.jpg",
  "created_at": "2025-07-04T01:55:41.588103+00:00",
  "updated_at": "2025-07-04T01:55:41.588103+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "293",
  "vendor": "The Tack Room",
  "amount": 124.53,
  "date": "2024-04-08",
  "entity": "Motive AI",
  "tags": [],
  "notes": "Receipt from The Tack Room",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_015542_de65c76e.jpg",
  "created_at": "2025-07-04T01:55:49.419428+00:00",
  "updated_at": "2025-07-04T01:55:49.419428+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "290",
  "vendor": "The Tack Room",
  "amount": 124.53,
  "date": "2024-04-08",
  "entity": "",
  "tags": [],
  "notes": "Receipt from The Tack Room",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_015339_ad6ada9d.jpg",
  "created_at": "2025-07-04T01:53:46.847507+00:00",
  "updated_at": "2025-07-04T01:53:46.847507+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "294",
  "vendor": "The Tack Room",
  "amount": 124.53,
  "date": "2024-04-08",
  "entity": "Motive AI",
  "tags": [],
  "notes": "Receipt from The Tack Room",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_015550_1692ff6d.jpg",
  "created_at": "2025-07-04T01:55:57.062033+00:00",
  "updated_at": "2025-07-04T01:55:57.062033+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "295",
  "vendor": "The Tack Room",
  "amount": 124.53,
  "date": "2024-04-08",
  "entity": "LA-AI",
  "tags": [],
  "notes": "Receipt from The Tack Room",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_015557_cb18b653.jpg",
  "created_at": "2025-07-04T01:56:04.458928+00:00",
  "updated_at": "2025-07-04T01:56:04.458928+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "296",
  "vendor": "The Tack Room",
  "amount": 124.53,
  "date": "2024-04-08",
  "entity": "Motive AI",
  "tags": [],
  "notes": "Receipt from The Tack Room",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_015606_9592eba2.jpg",
  "created_at": "2025-07-04T01:56:13.604609+00:00",
  "updated_at": "2025-07-04T01:56:13.604609+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "297",
  "vendor": "The Tack Room",
  "amount": 124.53,
  "date": "2024-04-08",
  "entity": "Motive AI",
  "tags": [],
  "notes": "Receipt from The Tack Room",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_020130_e04a5f9e.jpg",
  "created_at": "2025-07-04T02:01:37.398923+00:00",
  "updated_at": "2025-07-04T02:01:37.398923+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "298",
  "vendor": "The Tack Room",
  "amount": 124.53,
  "date": "2024-04-08",
  "entity": "Motive AI",
  "tags": [],
  "notes": "Receipt from The Tack Room",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_020148_b22633bc.jpg",
  "created_at": "2025-07-04T02:01:55.483114+00:00",
  "updated_at": "2025-07-04T02:01:55.483114+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  📊 Stats calculation - receipts count: 25
 LOG  ✅ API Response: /api/expenses?limit=5&_t=1751595011300 successful (527ms)
 LOG  [Performance] API_GET_/api/expenses?limit=5&_t=1751595011300: 527ms {"endpoint": "/api/expenses?limit=5&_t=1751595011300", "method": "GET", "statusCode": 200, "success": true}
 LOG  📊 Performance Metric: {"additionalData": {"endpoint": "/api/expenses?limit=5&_t=1751595011300", "method": "GET", "statusCode": 200, "success": true}, "duration": 527, "id": "perf_1751595011828_8b2j633xx", "metric": "API_GET_/api/expenses?limit=5&_t=1751595011300", "timestamp": 1751595011828}
 LOG  🔄 Transforming expenses from backend format: {
  "ai_reasoning": "The original OCR correctly identified the vendor and its location, but incorrectly captured the date and final amount. The receipt confirms the transaction date as '03-Jul-2025.' The final amount, including tips, matches recorded amount of $11.02 rather than $9.02.",
  "ai_validated": true,
  "amount": 11.02,
  "amount_confidence": 95,
  "confidence_score": null,
  "currency": "USD",
  "date_created": "2025-07-04T01:25:12.590132+00:00",
  "description": null,
  "email_subject": null,
  "entity": "",
  "entity_confidence": 95,
  "entity_source": null,
  "expense_date": "2025-07-03",
  "expense_type": "personal",
  "extraction_method": "ai_corrected",
  "id": 289,
  "image_content_type": "image/png",
  "image_filename": "20250704_012502_0ef56673.jpg",
  "image_size": 1152073,
  "image_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_012502_0ef56673.jpg",
  "location": null,
  "notes": "Receipt from LATTE DA",
  "raw_ocr_text": "LATTE DA\n32 SOUTH SECTION STREET\nFAIRHOPE, AL 365322212\n2519285295\n03-Jul-2025 8 19:24A\nTransaction 100006\n1 Brewed Coffee\nIce Rage\n$0.00\nLarge $2.52\n$0.00\nRegular $5.50\nVanilla $0.00\nSubtotal\n$8.02\nSales Tax 9%\n9%\n$0.72\nNon Cash Adjustment (3.5%)\n$0.28\nTotal\n$9.02\nTip\n$2.00\nCREDIT CARD SALE\n$11.02\nAMEX 4131\nRetain this copy for statement validation\n03-Jul-2025 8:19:53A\n$11.02 Method: CONTACTLESS\nAMEX CREDIT XXXXXXXXXXXX4131\nReference ID: 518400731195\nAuth ID: 823700\nMID: ***********5962\nAID: A000000025010901\nOnline: https://clover.com/p\n/P1CV3XYM05R8Y\nClover ID: XORVAJH9K1RY8\nPayment P1CV3XYM05R8Y\nClover Privacy Policy\nhttps://clover.com/privacy",
  "receipt_filename": null,
  "tags": [],
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0",
  "updated_at": "2025-07-04T01:25:12.590132+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "validation_cost": 0.004,
  "validation_triggers": [
    "low_amount_confidence",
    "low_date_confidence"
  ],
  "vendor": "LATTE DA"
}
 LOG  🔄 Transformed expense: {
  "id": "289",
  "vendor": "LATTE DA",
  "amount": 11.02,
  "date": "2025-07-03",
  "entity": "",
  "tags": [],
  "notes": "Receipt from LATTE DA",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_012502_0ef56673.jpg",
  "created_at": "2025-07-04T01:25:12.590132+00:00",
  "updated_at": "2025-07-04T01:25:12.590132+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "259",
  "vendor": "LATTE DA",
  "amount": 11.02,
  "date": "2025-07-03",
  "entity": "Motive AI",
  "tags": [],
  "notes": "Coffee with Sebastian",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/03/20250703_153806_0341eca1.jpg",
  "created_at": "2025-07-03T15:38:15.142344+00:00",
  "updated_at": "2025-07-03T15:38:46.997715+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "283",
  "vendor": "Fairhope Social Club",
  "amount": 33.79,
  "date": "2025-07-03",
  "entity": "Motive AI",
  "tags": [],
  "notes": "Receipt from Fairhope Social Club",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/03/20250703_214113_2b89f0a3.jpg",
  "created_at": "2025-07-03T21:41:21.870761+00:00",
  "updated_at": "2025-07-03T21:41:21.870761+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "288",
  "vendor": "LATTE DA",
  "amount": 11.02,
  "date": "2025-07-03",
  "entity": "",
  "tags": [],
  "notes": "Receipt from LATTE DA",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_012419_3479c46a.jpg",
  "created_at": "2025-07-04T01:24:26.566726+00:00",
  "updated_at": "2025-07-04T01:24:26.566726+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  🔄 Transformed expense: {
  "id": "257",
  "vendor": "Bayside Academy",
  "amount": 2708.43,
  "date": "2025-07-03",
  "entity": "Personal",
  "tags": [
    "School"
  ],
  "notes": "Bayside",
  "confidence_score": 0,
  "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/03/20250703_143859_b09b1439.jpg",
  "created_at": "2025-07-03T14:39:07.745391+00:00",
  "updated_at": "2025-07-03T14:39:38.518552+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
}
 LOG  📝 Full receipts response: {
  "data": [
    {
      "id": "289",
      "vendor": "LATTE DA",
      "amount": 11.02,
      "date": "2025-07-03",
      "entity": "",
      "tags": [],
      "notes": "Receipt from LATTE DA",
      "confidence_score": 0,
      "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_012502_0ef56673.jpg",
      "created_at": "2025-07-04T01:25:12.590132+00:00",
      "updated_at": "2025-07-04T01:25:12.590132+00:00",
      "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
      "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
    },
    {
      "id": "259",
      "vendor": "LATTE DA",
      "amount": 11.02,
      "date": "2025-07-03",
      "entity": "Motive AI",
      "tags": [],
      "notes": "Coffee with Sebastian",
      "confidence_score": 0,
      "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/03/20250703_153806_0341eca1.jpg",
      "created_at": "2025-07-03T15:38:15.142344+00:00",
      "updated_at": "2025-07-03T15:38:46.997715+00:00",
      "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
      "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
    },
    {
      "id": "283",
      "vendor": "Fairhope Social Club",
      "amount": 33.79,
      "date": "2025-07-03",
      "entity": "Motive AI",
      "tags": [],
      "notes": "Receipt from Fairhope Social Club",
      "confidence_score": 0,
      "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/03/20250703_214113_2b89f0a3.jpg",
      "created_at": "2025-07-03T21:41:21.870761+00:00",
      "updated_at": "2025-07-03T21:41:21.870761+00:00",
      "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
      "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
    },
    {
      "id": "288",
      "vendor": "LATTE DA",
      "amount": 11.02,
      "date": "2025-07-03",
      "entity": "",
      "tags": [],
      "notes": "Receipt from LATTE DA",
      "confidence_score": 0,
      "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_012419_3479c46a.jpg",
      "created_at": "2025-07-04T01:24:26.566726+00:00",
      "updated_at": "2025-07-04T01:24:26.566726+00:00",
      "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
      "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
    },
    {
      "id": "257",
      "vendor": "Bayside Academy",
      "amount": 2708.43,
      "date": "2025-07-03",
      "entity": "Personal",
      "tags": [
        "School"
      ],
      "notes": "Bayside",
      "confidence_score": 0,
      "receipt_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/03/20250703_143859_b09b1439.jpg",
      "created_at": "2025-07-03T14:39:07.745391+00:00",
      "updated_at": "2025-07-03T14:39:38.518552+00:00",
      "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
      "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0"
    }
  ],
  "total": 28,
  "page": 1,
  "limit": 5,
  "pages": 6
}
 LOG  📝 Loaded receipts: 5 receipts
 WARN  The <CameraView> component does not support children. This may lead to inconsistent behaviour or crashes. If you want to render content on top of the Camera, consider using absolute positioning.
 LOG  📱 Using simulator mock data
[RemoteTextInput] -[RTIInputSystemClient remoteTextInputSessionWithID:performInputOperation:]
perform input operation requires a valid sessionID. inputModality = Keyboard, inputOperation =
<null selector>, customInfoType = UIEmojiSearchOperations
[RemoteTextInput] -[RTIInputSystemClient remoteTextInputSessionWithID:performInputOperation:]
perform input operation requires a valid sessionID. inputModality = Keyboard, inputOperation =
<null selector>, customInfoType = UIEmojiSearchOperations
 LOG  📡 API Request: GET /api/entities
 LOG  ✅ API Response: /api/entities successful (188ms)
 LOG  [Performance] API_GET_/api/entities: 188ms {"endpoint": "/api/entities", "method": "GET", "statusCode": 200, "success": true}
 LOG  📊 Performance Metric: {"additionalData": {"endpoint": "/api/entities", "method": "GET", "statusCode": 200, "success": true}, "duration": 188, "id": "perf_1751595022428_zywoxbjb7", "metric": "API_GET_/api/entities", "timestamp": 1751595022428}
 LOG  🔍 Attempting real API upload...
 LOG  📡 API Request: POST /api/parse
 LOG  ✅ API Response: /api/parse successful (10681ms)
 LOG  [Performance] API_POST_/api/parse: 10681ms {"endpoint": "/api/parse", "method": "POST", "statusCode": 200, "success": true}
 LOG  📊 Performance Metric: {"additionalData": {"endpoint": "/api/parse", "method": "POST", "statusCode": 200, "success": true}, "duration": 10681, "id": "perf_1751595033429_y0t682zpd", "metric": "API_POST_/api/parse", "timestamp": 1751595033429}
 LOG  🔍 Raw OCR response: {
  "ai_validation": {
    "cost": 0.004,
    "reasoning": "AI confirmed original extraction accuracy",
    "triggers": [
      "low_amount_confidence",
      "low_date_confidence"
    ],
    "validated": true
  },
  "confidence": {
    "amount": 10,
    "entity": 95,
    "extraction_method": "generic_total_keyword"
  },
  "expense": {
    "ai_reasoning": "AI confirmed original extraction accuracy",
    "ai_validated": true,
    "amount": 124.53,
    "amount_confidence": 10,
    "confidence_score": null,
    "currency": "USD",
    "date_created": "2025-07-04T02:10:33.313174+00:00",
    "description": null,
    "email_subject": null,
    "entity": "",
    "entity_confidence": 95,
    "entity_source": null,
    "expense_date": "2024-04-08",
    "expense_type": "personal",
    "extraction_method": "generic_total_keyword",
    "id": 303,
    "image_content_type": "image/png",
    "image_filename": "20250704_021022_ef637313.jpg",
    "image_size": 459497,
    "image_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_021022_ef637313.jpg",
    "location": null,
    "notes": "Receipt from The Tack Room",
    "raw_ocr_text": "The Tack Room\n145 Lincoln Road\nLincoln, MA 01773\nServer: Griffin F\nCheck #36\nTable 59\nOrdered:\n4/8/24 7:13 PM\n1 BBQ Potato Chips\n$7.00\n1 Diet Coke\n$3.00\n1 Trillium Fort Point\n$10.00\n2 Fried Chicken Sandwich\n$34.00\n1 Famous Duck Grilled Cheese\n$25.00\n1 Mac & Cheese\n$17.00\n1 Burger of the moment\n$18.00\nSubtotal\n$114.00\nAdmin Fee (3.00%)\n$3.42\nTax\n$7.11\nTotal\n$124.53\nAdd us on Instagram: Tackroomlincoln",
    "receipt_filename": null,
    "tags": [],
    "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0",
    "updated_at": "2025-07-04T02:10:33.313174+00:00",
    "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
    "validation_cost": 0.004,
    "validation_triggers": [
      "low_amount_confidence",
      "low_date_confidence"
    ],
    "vendor": "The Tack Room"
  },
  "success": true
}
 LOG  🔍 Response keys: ["ai_validation", "confidence", "expense", "success"]
 LOG  ✅ Real API upload successful
 LOG  🔍 Upload response: {"ai_validation": {"cost": 0.004, "reasoning": "AI confirmed original extraction accuracy", "triggers": ["low_amount_confidence", "low_date_confidence"], "validated": true}, "confidence": {"amount": 10, "entity": 95, "extraction_method": "generic_total_keyword"}, "expense": {"ai_reasoning": "AI confirmed original extraction accuracy", "ai_validated": true, "amount": 124.53, "amount_confidence": 10, "confidence_score": null, "currency": "USD", "date_created": "2025-07-04T02:10:33.313174+00:00", "description": null, "email_subject": null, "entity": "", "entity_confidence": 95, "entity_source": null, "expense_date": "2024-04-08", "expense_type": "personal", "extraction_method": "generic_total_keyword", "id": 303, "image_content_type": "image/png", "image_filename": "20250704_021022_ef637313.jpg", "image_size": 459497, "image_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_021022_ef637313.jpg", "location": null, "notes": "Receipt from The Tack Room", "raw_ocr_text": "The Tack Room
145 Lincoln Road
Lincoln, MA 01773
Server: Griffin F
Check #36
Table 59
Ordered:
4/8/24 7:13 PM
1 BBQ Potato Chips
$7.00
1 Diet Coke
$3.00
1 Trillium Fort Point
$10.00
2 Fried Chicken Sandwich
$34.00
1 Famous Duck Grilled Cheese
$25.00
1 Mac & Cheese
$17.00
1 Burger of the moment
$18.00
Subtotal
$114.00
Admin Fee (3.00%)
$3.42
Tax
$7.11
Total
$124.53
Add us on Instagram: Tackroomlincoln", "receipt_filename": null, "tags": [], "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0", "updated_at": "2025-07-04T02:10:33.313174+00:00", "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2", "validation_cost": 0.004, "validation_triggers": ["low_amount_confidence", "low_date_confidence"], "vendor": "The Tack Room"}, "success": true}
 LOG  🔍 Raw upload response: {
  "ai_validation": {
    "cost": 0.004,
    "reasoning": "AI confirmed original extraction accuracy",
    "triggers": [
      "low_amount_confidence",
      "low_date_confidence"
    ],
    "validated": true
  },
  "confidence": {
    "amount": 10,
    "entity": 95,
    "extraction_method": "generic_total_keyword"
  },
  "expense": {
    "ai_reasoning": "AI confirmed original extraction accuracy",
    "ai_validated": true,
    "amount": 124.53,
    "amount_confidence": 10,
    "confidence_score": null,
    "currency": "USD",
    "date_created": "2025-07-04T02:10:33.313174+00:00",
    "description": null,
    "email_subject": null,
    "entity": "",
    "entity_confidence": 95,
    "entity_source": null,
    "expense_date": "2024-04-08",
    "expense_type": "personal",
    "extraction_method": "generic_total_keyword",
    "id": 303,
    "image_content_type": "image/png",
    "image_filename": "20250704_021022_ef637313.jpg",
    "image_size": 459497,
    "image_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_021022_ef637313.jpg",
    "location": null,
    "notes": "Receipt from The Tack Room",
    "raw_ocr_text": "The Tack Room\n145 Lincoln Road\nLincoln, MA 01773\nServer: Griffin F\nCheck #36\nTable 59\nOrdered:\n4/8/24 7:13 PM\n1 BBQ Potato Chips\n$7.00\n1 Diet Coke\n$3.00\n1 Trillium Fort Point\n$10.00\n2 Fried Chicken Sandwich\n$34.00\n1 Famous Duck Grilled Cheese\n$25.00\n1 Mac & Cheese\n$17.00\n1 Burger of the moment\n$18.00\nSubtotal\n$114.00\nAdmin Fee (3.00%)\n$3.42\nTax\n$7.11\nTotal\n$124.53\nAdd us on Instagram: Tackroomlincoln",
    "receipt_filename": null,
    "tags": [],
    "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0",
    "updated_at": "2025-07-04T02:10:33.313174+00:00",
    "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
    "validation_cost": 0.004,
    "validation_triggers": [
      "low_amount_confidence",
      "low_date_confidence"
    ],
    "vendor": "The Tack Room"
  },
  "success": true
}
 LOG  🔍 Upload response keys: ["ai_validation", "confidence", "expense", "success"]
 LOG  🔍 Extracted data structure: {
  "ai_reasoning": "AI confirmed original extraction accuracy",
  "ai_validated": true,
  "amount": 124.53,
  "amount_confidence": 10,
  "confidence_score": null,
  "currency": "USD",
  "date_created": "2025-07-04T02:10:33.313174+00:00",
  "description": null,
  "email_subject": null,
  "entity": "",
  "entity_confidence": 95,
  "entity_source": null,
  "expense_date": "2024-04-08",
  "expense_type": "personal",
  "extraction_method": "generic_total_keyword",
  "id": 303,
  "image_content_type": "image/png",
  "image_filename": "20250704_021022_ef637313.jpg",
  "image_size": 459497,
  "image_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_021022_ef637313.jpg",
  "location": null,
  "notes": "Receipt from The Tack Room",
  "raw_ocr_text": "The Tack Room\n145 Lincoln Road\nLincoln, MA 01773\nServer: Griffin F\nCheck #36\nTable 59\nOrdered:\n4/8/24 7:13 PM\n1 BBQ Potato Chips\n$7.00\n1 Diet Coke\n$3.00\n1 Trillium Fort Point\n$10.00\n2 Fried Chicken Sandwich\n$34.00\n1 Famous Duck Grilled Cheese\n$25.00\n1 Mac & Cheese\n$17.00\n1 Burger of the moment\n$18.00\nSubtotal\n$114.00\nAdmin Fee (3.00%)\n$3.42\nTax\n$7.11\nTotal\n$124.53\nAdd us on Instagram: Tackroomlincoln",
  "receipt_filename": null,
  "tags": [],
  "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0",
  "updated_at": "2025-07-04T02:10:33.313174+00:00",
  "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
  "validation_cost": 0.004,
  "validation_triggers": [
    "low_amount_confidence",
    "low_date_confidence"
  ],
  "vendor": "The Tack Room"
}
 LOG  🔍 Extracted data keys: ["ai_reasoning", "ai_validated", "amount", "amount_confidence", "confidence_score", "currency", "date_created", "description", "email_subject", "entity", "entity_confidence", "entity_source", "expense_date", "expense_type", "extraction_method", "id", "image_content_type", "image_filename", "image_size", "image_url", "location", "notes", "raw_ocr_text", "receipt_filename", "tags", "tenant_id", "updated_at", "user_id", "validation_cost", "validation_triggers", "vendor"]
 LOG  🔍 Parsed values: {"aiReasoning": "AI confirmed original extraction accuracy", "aiValidated": true, "amount": 124.53, "confidence": 10, "date": "2024-04-08", "tags": "", "vendor": "The Tack Room"}
 LOG  🔍 Setting form values - vendor: The Tack Room amount: 124.53
[RemoteTextInput] -[RTIInputSystemClient remoteTextInputSessionWithID:performInputOperation:]
perform input operation requires a valid sessionID. inputModality = Keyboard, inputOperation =
<null selector>, customInfoType = UIEmojiSearchOperations
 LOG  📡 API Request: GET /api/tags/search?q=Fo&limit=10
 LOG  📡 API Request: GET /api/tags/search?q=Foo&limit=10
 LOG  ✅ API Response: /api/tags/search?q=Fo&limit=10 successful (261ms)
 LOG  [Performance] API_GET_/api/tags/search?q=Fo&limit=10: 261ms {"endpoint": "/api/tags/search?q=Fo&limit=10", "method": "GET", "statusCode": 200, "success": true}
 LOG  📊 Performance Metric: {"additionalData": {"endpoint": "/api/tags/search?q=Fo&limit=10", "method": "GET", "statusCode": 200, "success": true}, "duration": 261, "id": "perf_1751595048078_4266xr1rg", "metric": "API_GET_/api/tags/search?q=Fo&limit=10", "timestamp": 1751595048078}
 LOG  📡 API Request: GET /api/tags/search?q=Food&limit=10
 LOG  ✅ API Response: /api/tags/search?q=Food&limit=10 successful (216ms)
 LOG  [Performance] API_GET_/api/tags/search?q=Food&limit=10: 216ms {"endpoint": "/api/tags/search?q=Food&limit=10", "method": "GET", "statusCode": 200, "success": true}
 LOG  📊 Performance Metric: {"additionalData": {"endpoint": "/api/tags/search?q=Food&limit=10", "method": "GET", "statusCode": 200, "success": true}, "duration": 216, "id": "perf_1751595048311_iqdk4sj2a", "metric": "API_GET_/api/tags/search?q=Food&limit=10", "timestamp": 1751595048311}
 LOG  ✅ API Response: /api/tags/search?q=Foo&limit=10 successful (458ms)
 LOG  [Performance] API_GET_/api/tags/search?q=Foo&limit=10: 458ms {"endpoint": "/api/tags/search?q=Foo&limit=10", "method": "GET", "statusCode": 200, "success": true}
 LOG  📊 Performance Metric: {"additionalData": {"endpoint": "/api/tags/search?q=Foo&limit=10", "method": "GET", "statusCode": 200, "success": true}, "duration": 458, "id": "perf_1751595048445_kcjcfe0ni", "metric": "API_GET_/api/tags/search?q=Foo&limit=10", "timestamp": 1751595048446}
 LOG  📡 API Request: GET /api/tags/search?q=me&limit=10
 LOG  ✅ API Response: /api/tags/search?q=me&limit=10 successful (203ms)
 LOG  [Performance] API_GET_/api/tags/search?q=me&limit=10: 203ms {"endpoint": "/api/tags/search?q=me&limit=10", "method": "GET", "statusCode": 200, "success": true}
 LOG  📊 Performance Metric: {"additionalData": {"endpoint": "/api/tags/search?q=me&limit=10", "method": "GET", "statusCode": 200, "success": true}, "duration": 203, "id": "perf_1751595052712_xzuqafovj", "metric": "API_GET_/api/tags/search?q=me&limit=10", "timestamp": 1751595052712}
 LOG  🔍 DEBUG: uploadedReceipt structure: {
  "ai_validation": {
    "cost": 0.004,
    "reasoning": "AI confirmed original extraction accuracy",
    "triggers": [
      "low_amount_confidence",
      "low_date_confidence"
    ],
    "validated": true
  },
  "confidence": {
    "amount": 10,
    "entity": 95,
    "extraction_method": "generic_total_keyword"
  },
  "expense": {
    "ai_reasoning": "AI confirmed original extraction accuracy",
    "ai_validated": true,
    "amount": 124.53,
    "amount_confidence": 10,
    "confidence_score": null,
    "currency": "USD",
    "date_created": "2025-07-04T02:10:33.313174+00:00",
    "description": null,
    "email_subject": null,
    "entity": "",
    "entity_confidence": 95,
    "entity_source": null,
    "expense_date": "2024-04-08",
    "expense_type": "personal",
    "extraction_method": "generic_total_keyword",
    "id": 303,
    "image_content_type": "image/png",
    "image_filename": "20250704_021022_ef637313.jpg",
    "image_size": 459497,
    "image_url": "https://erokkyoslaypfsgkzvxh.supabase.co/storage/v1/object/public/receipt-images/2025/07/04/20250704_021022_ef637313.jpg",
    "location": null,
    "notes": "Receipt from The Tack Room",
    "raw_ocr_text": "The Tack Room\n145 Lincoln Road\nLincoln, MA 01773\nServer: Griffin F\nCheck #36\nTable 59\nOrdered:\n4/8/24 7:13 PM\n1 BBQ Potato Chips\n$7.00\n1 Diet Coke\n$3.00\n1 Trillium Fort Point\n$10.00\n2 Fried Chicken Sandwich\n$34.00\n1 Famous Duck Grilled Cheese\n$25.00\n1 Mac & Cheese\n$17.00\n1 Burger of the moment\n$18.00\nSubtotal\n$114.00\nAdmin Fee (3.00%)\n$3.42\nTax\n$7.11\nTotal\n$124.53\nAdd us on Instagram: Tackroomlincoln",
    "receipt_filename": null,
    "tags": [],
    "tenant_id": "c0c49f78-e386-423a-ba85-18827c91d3d0",
    "updated_at": "2025-07-04T02:10:33.313174+00:00",
    "user_id": "Zfx8vkWyj0fYRuIM45dNYVQ4onU2",
    "validation_cost": 0.004,
    "validation_triggers": [
      "low_amount_confidence",
      "low_date_confidence"
    ],
    "vendor": "The Tack Room"
  },
  "success": true
}
 LOG  🔍 DEBUG: Extracted receiptId: 303
 LOG  🔍 DEBUG: uploadedReceipt?.expense?.id: 303
 LOG  🔍 DEBUG: uploadedReceipt?.id: undefined
 LOG  🔍 DEBUG: Is mock data? false
 LOG  🔍 DEBUG: About to call updateReceipt with receiptId: 303
 LOG  🔍 DEBUG: Update data: {"amount": 124.53, "date": "2024-04-08", "entity": "Motive AI", "notes": "Test Note", "tags": ["food", "Meals"], "vendor": "The Tack Room"}
 LOG  🔍 updateReceipt called with: {"id": 303, "updates": {"amount": 124.53, "date": "2024-04-08", "entity": "Motive AI", "notes": "Test Note", "tags": ["food", "Meals"], "vendor": "The Tack Room"}}
 LOG  🔍 Current auth token exists: true
 LOG  🔍 API endpoint will be: /api/expenses/303
 LOG  📡 API Request: PATCH /api/expenses/303
 LOG  [Performance] API_PATCH_/api/expenses/303: 215ms {"endpoint": "/api/expenses/303", "method": "PATCH", "statusCode": 500, "success": false}
[SnapTrack.debug.dylib] '[API_REQUEST_PATCH]', 'HTTP 500: ', { endpoint: '/api/expenses/303',
status: 500,
duration: 215,
hasToken: true }
[SnapTrack.debug.dylib] '❌ API Error: /api/expenses/303', { [ApiError: HTTP 500: ] status: 500,
code: undefined, name: 'ApiError' }
[SnapTrack.debug.dylib] '❌ Failed to save receipt:', { [ApiError: HTTP 500: ] status: 500, code:
undefined, name: 'ApiError' }
 LOG  📊 Performance Metric: {"additionalData": {"endpoint": "/api/expenses/303", "method": "PATCH", "statusCode": 500, "success": false}, "duration": 215, "id": "perf_1751595059696_hpnotegp5", "metric": "API_PATCH_/api/expenses/303", "timestamp": 1751595059696}
 ERROR  [API_REQUEST_PATCH] HTTP 500:  {"duration": 215, "endpoint": "/api/expenses/303", "hasToken": true, "status": 500}
 LOG  🐛 Error Report Details: {"additionalData": {"duration": 215, "endpoint": "/api/expenses/303", "hasToken": true, "status": 500}, "appVersion": "1.0.0", "context": "API_REQUEST_PATCH", "error": {"message": "HTTP 500: ", "name": "ApiError", "stack": "ApiError: HTTP 500: 
    at construct (native)
    at apply (native)
    at _construct (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.snaptrack.mobile&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable:13220:67)
    at Wrapper (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.snaptrack.mobile&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable:13192:25)
    at construct (native)
    at _callSuper (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.snaptrack.mobile&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable:3850:170)
    at ApiError (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.snaptrack.mobile&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable:3856:25)
    at ?anon_0_ (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.snaptrack.mobile&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable:3909:42)
    at next (native)
    at asyncGeneratorStep (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.snaptrack.mobile&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable:11703:19)
    at _next (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.snaptrack.mobile&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable:11717:29)
    at tryCallOne (address at InternalBytecode.js:1:1180)
    at anonymous (address at InternalBytecode.js:1:1874)"}, "id": "error_1751595059697_golb0ouf8", "timestamp": 1751595059703, "userAgent": "SnapTrack Mobile App"}
 ERROR  ❌ API Error: /api/expenses/303 [ApiError: HTTP 500: ]
 ERROR  ❌ Failed to save receipt: [ApiError: HTTP 500: ]
[RemoteTextInput] -[RTIInputSystemClient remoteTextInputSessionWithID:performInputOperation:]
perform input operation requires a valid sessionID. inputModality = Keyboard, inputOperation =
<null selector>, customInfoType = UIEmojiSearchOperations