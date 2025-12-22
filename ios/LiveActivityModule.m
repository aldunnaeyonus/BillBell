#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(LiveActivityModule, RCTEventEmitter)

RCT_EXTERN_METHOD(refreshWidget)
RCT_EXTERN_METHOD(clearAllSavedBills)
RCT_EXTERN_METHOD(saveBillsToStore:(NSString *)jsonString)

RCT_EXTERN_METHOD(getSummaryDataWithResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(consumeLastPaidBillId:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startActivity:(NSString *)overdueTotal
                  overdueCount:(NSInteger)overdueCount
                  monthTotal:(NSString *)monthTotal
                  monthCount:(NSInteger)monthCount
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(endAllActivities)
RCT_EXTERN_METHOD(addListener:(NSString *)eventName)
RCT_EXTERN_METHOD(removeListeners:(NSInteger)count)

@end
