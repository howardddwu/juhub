// Generates JuHub PWA icons: teal gradient (#14b8a6 -> #0f766e, 135deg) with a
// white "hub" mark — four friends (dots) on spokes converging to a center node.
// Encodes the name (Ju·Hub) and 聚 (gather toward a point). No text glyphs.
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

    // Hub mark geometry (ratios of icon size)
    let cx = size / 2, cy = size / 2
    let orbit = size * 0.255   // distance of outer dots from center
    let centerR = size * 0.115 // central node radius
    let dotR = size * 0.072    // outer dot radius
    let spokeW = size * 0.027  // spoke stroke width

    // Four diagonal positions (45°, 135°, 225°, 315°)
    let k = orbit / 2.0.squareRoot()
    let dots = [
        NSPoint(x: cx + k, y: cy + k),
        NSPoint(x: cx - k, y: cy + k),
        NSPoint(x: cx - k, y: cy - k),
        NSPoint(x: cx + k, y: cy - k),
    ]

    // Spokes: center -> each dot, drawn under the nodes
    NSColor.white.withAlphaComponent(0.5).setStroke()
    for d in dots {
        let path = NSBezierPath()
        path.lineWidth = spokeW
        path.lineCapStyle = .round
        path.move(to: NSPoint(x: cx, y: cy))
        path.line(to: d)
        path.stroke()
    }

    // Outer dots (friends)
    NSColor.white.withAlphaComponent(0.92).setFill()
    for d in dots {
        NSBezierPath(ovalIn: NSRect(x: d.x - dotR, y: d.y - dotR, width: dotR * 2, height: dotR * 2)).fill()
    }

    // Center node (the hub)
    NSColor.white.setFill()
    NSBezierPath(ovalIn: NSRect(x: cx - centerR, y: cy - centerR, width: centerR * 2, height: centerR * 2)).fill()

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
