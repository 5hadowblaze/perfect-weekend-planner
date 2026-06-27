import Foundation

enum AppConfig {
  private static let localBackendURL = "http://127.0.0.1:8000"
  /// App Hosting origin + `/api` prefix (Next.js proxies to Cloud Run).
  private static let productionBackendURL =
    "https://weekend-explorer--perfect-weekend-planner.us-central1.hosted.app/api"

  /// Backend base URL from Info.plist `BACKEND_URL`, with environment-aware defaults.
  static var backendURL: URL {
    let raw = Bundle.main.object(forInfoDictionaryKey: "BACKEND_URL") as? String
    let trimmed = raw?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

    let urlString: String
    if !trimmed.isEmpty {
      urlString = trimmed
    } else {
      #if DEBUG
      urlString = localBackendURL
      #else
      urlString = productionBackendURL
      #endif
    }

    guard let url = URL(string: urlString) else {
      return URL(string: localBackendURL)!
    }
    return url
  }

  /// True when a real `GoogleService-Info.plist` CLIENT_ID is present (not the placeholder).
  static var isFirebaseConfigured: Bool {
    guard
      let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
      let plist = NSDictionary(contentsOfFile: path),
      let clientID = plist["CLIENT_ID"] as? String
    else {
      return false
    }

    let trimmed = clientID.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return false }
    return trimmed.uppercased() != "PLACEHOLDER"
  }
}
