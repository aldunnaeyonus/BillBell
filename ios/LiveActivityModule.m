#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LiveActivityModule, NSObject)

  // --- FIX: Ensure the argument names match the Swift signature ---
RCT_EXTERN_METHOD(startActivity:(NSString *)overdueTotal
                  overdueCount:(NSInteger)overdueCount
                  monthTotal:(NSString *)monthTotal
                  monthCount:(NSInteger)monthCount
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(endAllActivities)

@end
