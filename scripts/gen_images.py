"""
Generate dark cinematic placeholder PNGs for ScriptLab course cards.
"""
from PIL import Image, ImageDraw
import math, os

OUT = r"d:\develop-scriptlab-screenwriting-platform\public\images"
W, H = 800, 500

# Palette
INK      = (9, 10, 12)
CHARCOAL = (22, 25, 32)
SLATE    = (28, 32, 42)
GOLD     = (201, 162, 77)
GOLD_DIM = (120, 95, 42)
IVORY    = (244, 241, 234)
MUTED    = (100, 100, 110)
LINE     = (40, 44, 56)

def lerp_color(a, b, t):
    return tuple(int(a[i] + (b[i]-a[i])*t) for i in range(3))

def make_base(draw: ImageDraw.ImageDraw, accent=GOLD):
    """Dark gradient background + subtle grid."""
    # gradient rows
    img_w, img_h = W, H
    for y in range(img_h):
        t = y / img_h
        c = lerp_color(INK, CHARCOAL, t)
        draw.line([(0, y), (img_w, y)], fill=c)
    # subtle grid
    for x in range(0, W, 60):
        draw.line([(x, 0), (x, H)], fill=(255,255,255,8))
    for y in range(0, H, 60):
        draw.line([(0, y), (W, y)], fill=(255,255,255,8))

def gold_line(draw, y, alpha=80):
    for x in range(W):
        t = abs(x/W - 0.5) * 2          # 0 at centre, 1 at edges
        a = int(alpha * (1 - t))
        draw.point((x, y), fill=(*GOLD, a))

def corner_lines(draw):
    """Film-corner bracket marks."""
    sz = 24
    t = 2
    corners = [(30,20), (W-30-sz, 20), (30, H-20-sz), (W-30-sz, H-20-sz)]
    for cx, cy in corners:
        # top-left of each bracket
        draw.rectangle([cx, cy, cx+sz, cy+t], fill=GOLD_DIM)
        draw.rectangle([cx, cy, cx+t, cy+sz], fill=GOLD_DIM)

def label_bottom(draw, title, subtitle):
    """Centred title + subtitle near bottom."""
    # divider line (alpha blend manually)
    gold_line(draw, H-85, alpha=120)
    # title — large letters spaced out
    bx = W//2
    by = H - 60
    # draw shadow
    _text_centered(draw, bx+1, by+1, title.upper(), size=28, color=(0,0,0,180))
    _text_centered(draw, bx,   by,   title.upper(), size=28, color=IVORY)
    # subtitle
    _text_centered(draw, bx, by+36, subtitle.upper(), size=11, color=GOLD)

def _text_centered(draw, x, y, text, size=20, color=IVORY):
    """Approximate character-width centering (no truetype needed)."""
    # PIL default font: each char ~6px wide at size 10 → scale ≈ size/10 * 6
    char_w = size * 0.55
    total  = len(text) * char_w
    tx = int(x - total / 2)
    try:
        from PIL import ImageFont
        font = ImageFont.truetype("arial.ttf", size)
    except Exception:
        font = None
    if font:
        draw.text((tx, y - size//2), text, fill=color, font=font)
    else:
        draw.text((tx, y - size//2), text, fill=color)

# ── individual generators ────────────────────────────────────────────────────

def gen_hero():
    img = Image.new("RGBA", (W, H))
    d   = ImageDraw.Draw(img, "RGBA")
    make_base(d)
    # film strips
    for side in [0, W-50]:
        for yy in range(0, H, 50):
            d.rectangle([side+6, yy+5, side+44, yy+40], outline=LINE, width=1)
    # large circle
    cx, cy, r = W//2, H//2, 180
    d.ellipse([cx-r, cy-r, cx+r, cy+r], outline=(*GOLD, 30), width=1)
    d.ellipse([cx-r//2, cy-r//2, cx+r//2, cy+r//2], outline=(*GOLD, 20), width=1)
    corner_lines(d)
    label_bottom(d, "ScriptLab", "Cinematic Masterclass")
    img.save(os.path.join(OUT, "hero.png"))
    print("hero.png")

def gen_structure():
    img = Image.new("RGBA", (W, H))
    d   = ImageDraw.Draw(img, "RGBA")
    make_base(d)
    corner_lines(d)
    # 3 act pillars
    acts = [("ACT I",  90, 160, 220), ("ACT II", 275, 100, 525), ("ACT III", 560, 200, 450)]
    heights = [220, 300, 180]
    bases   = [380, 380, 380]
    tops    = [160, 80, 200]
    for i, (label, lx, _, _) in enumerate(acts):
        x1 = [90, 275, 560][i]
        x2 = [240, 525, 710][i]
        y2 = bases[i]
        y1 = tops[i]
        # pillar fill
        d.rectangle([x1, y1, x2, y2], fill=(*CHARCOAL, 180), outline=(*GOLD, 100), width=1)
        d.rectangle([x1, y1, x2, y1+30], fill=(*GOLD, 35))
        _text_centered(d, (x1+x2)//2, y1+15, label, size=11, color=GOLD)
    # arc
    pts = []
    for x in range(90, 711, 4):
        t  = (x - 90) / 620
        y  = int(380 - 300 * math.sin(math.pi * t))
        pts.append((x, y))
    if len(pts) > 1:
        d.line(pts, fill=(*GOLD, 60), width=1)
    label_bottom(d, "Story Structure", "Architecture")
    img.save(os.path.join(OUT, "course-structure.png"))
    print("course-structure.png")

def gen_character():
    img = Image.new("RGBA", (W, H))
    d   = ImageDraw.Draw(img, "RGBA")
    make_base(d)
    corner_lines(d)
    cx, cy = W//2, 210
    # orbit ring
    r = 130
    d.ellipse([cx-r, cy-r, cx+r, cy+r], outline=(*GOLD, 25), width=1)
    # figure: head + body
    d.ellipse([cx-20, cy-85, cx+20, cy-45], outline=(*GOLD, 150), width=2)
    d.ellipse([cx-30, cy-45, cx+30, cy+10], outline=(*GOLD, 150), width=2)
    # arms / legs
    d.line([cx-30, cy-25, cx-85, cy+40], fill=(*GOLD, 120), width=2)
    d.line([cx+30, cy-25, cx+85, cy+40], fill=(*GOLD, 120), width=2)
    d.line([cx-15, cy+10, cx-30, cy+90], fill=(*GOLD, 120), width=2)
    d.line([cx+15, cy+10, cx+30, cy+90], fill=(*GOLD, 120), width=2)
    # labels
    for txt, tx, ty in [("WANT",cx-150,cy-30),("NEED",cx+130,cy-30),("LIE",cx,cy-120),("WOUND",cx,cy+110)]:
        _text_centered(d, tx, ty, txt, size=10, color=GOLD)
    label_bottom(d, "Character Design", "Want  Need  Lie  Wound")
    img.save(os.path.join(OUT, "course-character.png"))
    print("course-character.png")

def gen_dialogue():
    img = Image.new("RGBA", (W, H))
    d   = ImageDraw.Draw(img, "RGBA")
    make_base(d)
    corner_lines(d)
    # bubble A (left)
    d.rounded_rectangle([70, 70, 390, 180], radius=14, outline=(*GOLD, 130), width=2)
    d.polygon([(140,180),(110,210),(175,180)], outline=(*GOLD, 130))
    for yy, ww in [(100,260),(118,230),(136,250),(154,180)]:
        d.rectangle([95, yy, 95+ww, yy+4], fill=(*GOLD, 70))
    # bubble B (right)
    d.rounded_rectangle([410, 220, 730, 330], radius=14, outline=(*GOLD, 130), width=2)
    d.polygon([(625,220),(595,190),(660,220)], outline=(*GOLD, 130))
    for yy, ww in [(245,260),(263,210),(281,245),(299,170)]:
        d.rectangle([435, yy, 435+ww, yy+4], fill=(*GOLD, 70))
    # subtext wave
    for x in range(100, 700, 2):
        y = int(380 + 6*math.sin(x/20))
        d.point((x, y), fill=(*GOLD, 50))
    _text_centered(d, W//2, 395, "SUBTEXT", size=10, color=GOLD_DIM)
    label_bottom(d, "Dialogue & Scene", "Subtext  Conflict  Rhythm")
    img.save(os.path.join(OUT, "course-dialogue.png"))
    print("course-dialogue.png")

def gen_breaking():
    img = Image.new("RGBA", (W, H))
    d   = ImageDraw.Draw(img, "RGBA")
    make_base(d)
    corner_lines(d)
    cards = [
        (80,  70,  "PREMISE"),
        (265, 70,  "CONFLICT"),
        (450, 70,  "MIDPOINT"),
        (635, 70,  "???"),
        (80,  200, "BREAK INTO 2"),
        (265, 200, "ALL IS LOST"),
        (450, 200, "FINALE"),
    ]
    for x, y, label in cards:
        alpha = 40 if label == "???" else 110
        d.rectangle([x, y, x+160, y+100], fill=(*SLATE, 80), outline=(*GOLD, alpha), width=1)
        _text_centered(d, x+80, y+50, label, size=10, color=GOLD if label != "???" else MUTED)
    # arrows between row 1
    for x in [240, 425, 610]:
        d.line([(x, 120), (x+22, 120)], fill=(*GOLD, 80), width=1)
        d.polygon([(x+22,115),(x+30,120),(x+22,125)], fill=(*GOLD, 80))
    label_bottom(d, "Story Breaking", "Index Cards  Beat Board")
    img.save(os.path.join(OUT, "course-breaking.png"))
    print("course-breaking.png")

def gen_tv():
    img = Image.new("RGBA", (W, H))
    d   = ImageDraw.Draw(img, "RGBA")
    make_base(d)
    corner_lines(d)
    # TV outline
    d.rounded_rectangle([180, 60, 620, 360], radius=12, outline=(*GOLD, 130), width=2)
    d.rectangle([200, 80, 600, 340], fill=(*INK, 220), outline=(*LINE, 255), width=1)
    # fake script on screen
    _text_centered(d, 400, 165, "INT. WRITERS' ROOM - DAY", size=12, color=(*IVORY, 120))
    for yy, ww in [(190,340),(207,300),(224,320),(244,200),(261,310),(278,270),(295,320)]:
        d.rectangle([220, yy, 220+ww, yy+4], fill=(*GOLD, 50))
    # stand
    d.rounded_rectangle([355, 360, 445, 380], radius=4, outline=(*GOLD, 100), width=1)
    d.rounded_rectangle([305, 378, 495, 390], radius=4, outline=(*GOLD, 100), width=1)
    # antenna
    d.line([(345,60),(310,22)], fill=(*GOLD, 100), width=2)
    d.line([(455,60),(490,22)], fill=(*GOLD, 100), width=2)
    label_bottom(d, "TV Writing", "Series  Pilots  Room Dynamics")
    img.save(os.path.join(OUT, "course-tv.png"))
    print("course-tv.png")

def gen_commercial():
    img = Image.new("RGBA", (W, H))
    d   = ImageDraw.Draw(img, "RGBA")
    make_base(d)
    corner_lines(d)
    # billboard
    d.rounded_rectangle([130, 60, 670, 330], radius=6, outline=(*GOLD, 130), width=2)
    d.rectangle([150, 80, 650, 310], fill=(*INK, 200))
    _text_centered(d, 400, 150, "THE HOOK", size=22, color=(*IVORY, 150))
    _text_centered(d, 400, 185, "30 SECONDS TO CHANGE EVERYTHING", size=10, color=(*GOLD, 120))
    d.rectangle([180, 200, 620, 201], fill=(*GOLD, 50))
    # storyboard frames
    for i, x in enumerate([185, 295, 405, 515]):
        d.rectangle([x, 215, x+90, 290], outline=(*GOLD, 100), width=1)
        _text_centered(d, x+45, 299, f"0{i+1}", size=9, color=GOLD_DIM)
    # billboard legs
    d.line([(265,330),(245,400)], fill=(*GOLD, 80), width=2)
    d.line([(535,330),(555,400)], fill=(*GOLD, 80), width=2)
    label_bottom(d, "Commercial Spec", "Logline  Pitch  Hook")
    img.save(os.path.join(OUT, "course-commercial.png"))
    print("course-commercial.png")

def gen_doctoring():
    img = Image.new("RGBA", (W, H))
    d   = ImageDraw.Draw(img, "RGBA")
    make_base(d)
    corner_lines(d)
    # script page
    d.rectangle([100, 40, 420, 390], fill=(*CHARCOAL, 60), outline=(*GOLD, 50), width=1)
    lines_data = [(120,70,260,False),(120,88,240,False),(120,106,255,False),
                  (175,124,160,False),(120,142,260,False),(120,160,230,False),
                  (120,178,220,True), # strikethrough
                  (120,206,230,False),(175,224,160,False),(120,252,260,False)]
    for lx, ly, lw, strike in lines_data:
        col = (*GOLD, 55) if not strike else (*MUTED, 80)
        d.rectangle([lx, ly, lx+lw, ly+4], fill=col)
        if strike:
            d.line([(lx, ly+2),(lx+lw, ly+2)], fill=(150, 30, 30, 160), width=2)
    # red annotation
    _text_centered(d, 230, 198, "^ INSERT: motivation here", size=10, color=(160, 40, 40))
    # margin note circle
    d.ellipse([105,248,125,268], outline=(150,30,30,120), width=1)
    _text_centered(d, 115, 258, "?", size=10, color=(150,30,30))
    # coverage panel
    d.rectangle([450, 80, 720, 360], fill=(*SLATE, 60), outline=(*GOLD, 70), width=1)
    _text_centered(d, 585, 108, "COVERAGE", size=11, color=GOLD)
    d.line([(465,120),(705,120)], fill=(*GOLD, 50))
    rows = [("CONCEPT",80),("STRUCTURE",60),("CHARACTER",90),("DIALOGUE",70)]
    for i, (rname, pct) in enumerate(rows):
        ry = 140 + i*45
        _text_centered(d, 510, ry, rname, size=9, color=(*IVORY, 120))
        d.rectangle([550, ry+10, 700, ry+22], fill=(*SLATE, 180), outline=(*LINE,200), width=1)
        bar_w = int(150 * pct/100)
        d.rectangle([550, ry+10, 550+bar_w, ry+22], fill=(*GOLD, 130))
    label_bottom(d, "Script Doctoring", "Diagnosis  Coverage  Repair")
    img.save(os.path.join(OUT, "course-doctoring.png"))
    print("course-doctoring.png")

def gen_rewrite():
    img = Image.new("RGBA", (W, H))
    d   = ImageDraw.Draw(img, "RGBA")
    make_base(d)
    corner_lines(d)
    # two circles
    for cx, label, sublabel in [(235,"DRAFT 1","INSTINCT"), (565,"REWRITE","STRUCTURE")]:
        r = 90
        d.ellipse([cx-r, 170-r, cx+r, 170+r], outline=(*GOLD, 100), width=1)
        _text_centered(d, cx, 165, label, size=15, color=IVORY)
        _text_centered(d, cx, 185, sublabel, size=9, color=GOLD_DIM)
    # arrow right
    for x in range(330, 472, 2):
        t = (x-330)/142
        y = int(170 - 40*math.sin(math.pi*t))
        d.point((x,y), fill=(*GOLD, 100))
    d.polygon([(470,148),(480,160),(460,163)], fill=(*GOLD, 100))
    _text_centered(d, 400, 110, "NOTES", size=10, color=GOLD_DIM)
    # loop back arrow (bottom)
    for x in range(475, 320, -2):
        t = (475-x)/155
        y = int(280 + 40*math.sin(math.pi*t))
        d.point((x,y), fill=(*GOLD, 60))
    _text_centered(d, 400, 348, "POLISH PASS", size=9, color=GOLD_DIM)
    label_bottom(d, "The Rewrite", "Pass-by-Pass Strategy")
    img.save(os.path.join(OUT, "course-rewrite.png"))
    print("course-rewrite.png")

def gen_room():
    img = Image.new("RGBA", (W, H))
    d   = ImageDraw.Draw(img, "RGBA")
    make_base(d)
    corner_lines(d)
    # oval table
    cx, cy = 400, 215
    d.ellipse([cx-220, cy-110, cx+220, cy+110], outline=(*GOLD, 120), width=2)
    d.ellipse([cx-210, cy-100, cx+210, cy+100], fill=(*INK, 180))
    # whiteboard
    d.rectangle([260, 28, 540, 72], fill=(*SLATE, 180), outline=(*GOLD, 70), width=1)
    _text_centered(d, 400, 50, "ACT TWO BREAK?", size=11, color=(*GOLD, 180))
    # cards on table
    for cx2, cy2, angle in [(380,195,0),(345,215,-15),(425,210,10)]:
        import math as m
        pts = []
        for dx, dy in [(-25,-17),(25,-17),(25,17),(-25,17)]:
            rad = m.radians(angle)
            rx = dx*m.cos(rad) - dy*m.sin(rad)
            ry = dx*m.sin(rad) + dy*m.cos(rad)
            pts.append((cx2+rx, cy2+ry))
        d.polygon(pts, outline=(*GOLD, 80), width=1)
    # seats (circles around table)
    seat_positions = [
        (400, 90),(560, 130),(650, 215),(560, 300),
        (400, 340),(240, 300),(150, 215),(240, 130)
    ]
    for sx, sy in seat_positions:
        d.ellipse([sx-12, sy-12, sx+12, sy+12], outline=(*GOLD, 120), width=2)
    label_bottom(d, "Writers' Room", "Collaboration  Pitching  Notes")
    img.save(os.path.join(OUT, "course-room.png"))
    print("course-room.png")

def gen_tableread():
    img = Image.new("RGBA", (W, H))
    d   = ImageDraw.Draw(img, "RGBA")
    make_base(d)
    corner_lines(d)
    # microphone 1 (left-centre)
    d.ellipse([265, 68, 335, 155], outline=(*GOLD, 150), width=2)
    # mic grid lines
    for y in range(85, 150, 15):
        d.line([(270, y),(330, y)], fill=(*GOLD, 60))
    d.line([(300,155),(300,310)], fill=(*GOLD, 130), width=2)
    d.ellipse([250,310,350,328], outline=(*GOLD, 100), width=1)
    # script on stand
    d.rectangle([195, 230, 320, 310], fill=(*CHARCOAL, 100), outline=(*GOLD, 70), width=1)
    for yy, ww in [(245,100),(258,80),(271,95),(284,70)]:
        d.rectangle([205, yy, 205+ww, yy+4], fill=(*GOLD, 55))
    # microphone 2 (right)
    d.ellipse([460, 90, 520, 165], outline=(*GOLD, 110), width=1)
    d.line([(490,165),(490,310)], fill=(*GOLD, 100), width=2)
    d.ellipse([452,310,528,324], outline=(*GOLD, 70), width=1)
    # sound waves
    for r2 in [30, 55, 80]:
        d.arc([300-r2, 108-r2, 300+r2, 108+r2], start=-60, end=60,
              fill=(*GOLD, max(10, 90-r2)), width=1)
    # table line
    d.rectangle([80, 318, 720, 320], fill=(*GOLD, 50))
    label_bottom(d, "Table Read", "Performance  Feedback  Live")
    img.save(os.path.join(OUT, "course-tableread.png"))
    print("course-tableread.png")

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    gen_hero()
    gen_structure()
    gen_character()
    gen_dialogue()
    gen_breaking()
    gen_tv()
    gen_commercial()
    gen_doctoring()
    gen_rewrite()
    gen_room()
    gen_tableread()
    print("\nAll PNGs generated!")

