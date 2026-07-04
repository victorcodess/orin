/* eslint-disable @next/next/no-img-element */
export type OpenGraphImageProps = {
  description?: string;
  backgroundImage?: string;
};

const DEFAULT_DESCRIPTION =
  "A voice-enabled AI companion you can text and call. Warm, thoughtful, and yours to customize.";

const SIDEBAR = "#f9eee4";
const BG = "#fcf8f3";
const ORANGE = "#f97015";
const INSET = 24;
const RADIUS = 36;

export function OpenGraphImage({
  description = DEFAULT_DESCRIPTION,
  backgroundImage,
}: OpenGraphImageProps) {
  return (
    <div
      style={{
        display: "flex",
        width: 1200,
        height: 630,
        background: SIDEBAR,
        padding: INSET,
      }}
    >
      {/* Inner panel */}
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          background: BG,
          borderRadius: RADIUS,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 8px 48px rgba(23,16,11,0.08), 0 2px 12px rgba(23,16,11,0.02)",
        }}
      >
        {backgroundImage ? (
          <img
            alt=""
            src={backgroundImage}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: RADIUS,
            }}
          />
        ) : null}

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 36,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: ORANGE,
              }}
            />
            <div
              style={{
                fontFamily: "Crimson Text",
                fontSize: 108,
                fontWeight: 600,
                letterSpacing: "-0.04em",
                color: "#17100b",
                lineHeight: 1,
              }}
            >
              Orin
            </div>
          </div>

          <div
            style={{
              fontFamily: "Geist",
              fontSize: 24,
              lineHeight: 1.45,
              color: "#312620",
              textAlign: "center",
              maxWidth: 640,
            }}
          >
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}
