// Generates JuHub PWA icons: teal gradient (#14b8a6 -> #0f766e, 135deg) with white "聚".
// Mirrors the .hero-icon style in src/index.css (corner radius 16/64, font-size 34/64, weight 600).
// Usage: swift scripts/generate-icons.swift
import AppKit

func makeIcon(size: CGFloat, cornerRadiusRatio: CGFloat, outputPath: String) {
    let px = Int(size)
    guard let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil, pixelsWide: px, pixelsHigh: px,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .calibratedRGB, bytesPerRow: 0, bitsPerPixel: 0
    ) else { fatalError("failed to create bitmap rep") }

    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)

    let rect = NSRect(x: 0, y: 0, width: size, height: size)
    if cornerRadiusRatio > 0 {
        let radius = size * cornerRadiusRatio
        NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius).addClip()
    }

    let teal = NSColor(srgbRed: 0x14 / 255.0, green: 0xB8 / 255.0, blue: 0xA6 / 255.0, alpha: 1)
    let dark = NSColor(srgbRed: 0x0F / 255.0, green: 0x76 / 255.0, blue: 0x6E / 255.0, alpha: 1)
    // CSS 135deg = top-left to bottom-right; NSGradient angle -45 in flipped-to-unflipped terms
    NSGradient(starting: teal, ending: dark)!.draw(in: rect, angle: -45)

    let fontSize = size * 34.0 / 64.0
    let font = NSFont(name: "PingFangSC-Semibold", size: fontSize)
        ?? NSFont.systemFont(ofSize: fontSize, weight: .semibold)
    let text = NSAttributedString(string: "聚", attributes: [
        .font: font,
        .foregroundColor: NSColor.white,
    ])
    let textSize = text.size()
    text.draw(at: NSPoint(x: (size - textSize.width) / 2, y: (size - textSize.height) / 2))

    NSGraphicsContext.restoreGraphicsState()

    guard let data = rep.representation(using: .png, properties: [:]) else { fatalError("png encode failed") }
    try! data.write(to: URL(fileURLWithPath: outputPath))
    print("wrote \(outputPath) (\(px)x\(px))")
}

let publicDir = "public"
makeIcon(size: 192, cornerRadiusRatio: 0.25, outputPath: "\(publicDir)/icon-192.png")
makeIcon(size: 512, cornerRadiusRatio: 0.25, outputPath: "\(publicDir)/icon-512.png")
// apple-touch-icon: full-bleed square — iOS applies its own rounded mask
makeIcon(size: 180, cornerRadiusRatio: 0, outputPath: "\(publicDir)/apple-touch-icon.png")
