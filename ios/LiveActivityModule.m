  // MARK: - File: LiveActivityModule.m (Final Corrected Content)

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LiveActivityModule, NSObject)

  // --- EXISTING: startActivity declaration ---
RCT_EXTERN_METHOD(startActivity:(NSString *)overdueTotal
                  overdueCount:(NSInteger)overdueCount
                  monthTotal:(NSString *)monthTotal
                  monthCount:(NSInteger)monthCount
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

  // --- FIX APPLIED: Explicit internal declaration for the Swift method ---
  // This resolves the "No visible @interface" error by making the method visible to the compiler.

  // This is the public method definition for fetching data.
RCT_EXPORT_METHOD(getSummaryDataWithResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // FIX APPLIED: Internal call syntax now matches the simpler, unlabeled Swift function.
  [self getSummaryDataWithResolver: resolve rejecter:reject];
}

RCT_EXTERN_METHOD(clearAllSavedBills)

RCT_EXTERN_METHOD(endAllActivities)

@end
