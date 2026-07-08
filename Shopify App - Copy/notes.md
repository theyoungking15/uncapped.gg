The current screenshot is functional, but it looks more like a clean spreadsheet than a promo graphic. To make it visually appealing, I’d improve it in this order:

  1. Stronger hero section: show the CPU image larger, reduce the huge title size slightly, and add bold chips like 12 bundle options, Starts at ₱14,300, Save up to ₱800. (probably don't add the 12 bundle options but the starts at and save up to is fine)
  2. More intentional background: keep the warm off-white, but add subtle dark/gray gradient shapes or a black top accent so it feels branded instead of plain.
  3. Better table hierarchy: make Bundle Price the main visual anchor, turn savings into a small pill like Save ₱300, and use lighter row separators with alternating soft row backgrounds.
  4. Highlight the cheapest/best row: add a Lowest price or Best value badge to the first/cheapest option. The current Selected badge at the bottom is less useful for a public screenshot. (agree with removing the selected badge, but how will you will know know the best value?)
  5. Make the image less tall for posting: if there are many bundles, either split into multiple images or show top 8 plus a footer like 4 more options available on the bundle page. The current full list is accurate but very long for social use. (probably in the future)
  6. Improve footer: shorten the disclaimer and make uncappedpc.com plus maybe Binondo, Manila feel like a branded signature.

  Recommended v2 direction: “premium price-list card”, still clean and easy to read, but with stronger contrast, bigger CPU/product hero, price chips, and a more polished table.

  - use logo in top mid.
  - remove Uncapped PC text
  - remove 12 visible bundle options
  - remove the brand because there's a brand that's already included.
  - add socials on the bottom same as the one that we have on the quote
  - make font to all inter
  - on the hero side you have the 7500F Bundle and Ryzen 5 7500F Tray Type Bundles, probably just use the Ryzen 5 7500F Tray Type Bundles

 here's what I want to change with the current version of the screenshot
 - remove the brand below the motherboard name it becomes redundant with the motherboard name.
 - make the motherboard name lighted probably reduce the weight of the text. 
 - and is there a way for us to improve the speed of the screenshot. I takes at least 5 mins to generate the screenshot.

 if unlock_on_any_primary_promo is true, any active pc_builder_promo can unlock it
  - if unlock_on_any_primary_promo is false and qualifying_promo_handles has values, only those handles can unlock it

  Since you chose any active promo, v1 does not need qualifying_promo_handles filled. We can still include the field now for future control.

  i like this idea adding the qualifying promo handles


  Add a new Shopify metaobject type: pc_builder_addon_discount.
  - Keep cpu_motherboard_bundle and pc_builder_promo unchanged.
  - Metaobject fields:
      - promo_label: single line text
      - is_active: boolean
      - priority: integer, optional
      - unlock_on_bundle_discount: boolean
      - unlock_on_any_primary_promo: boolean
      - qualifying_promo_handles: JSON array, optional
      - stack_with_bundle_discount: boolean
      - stack_with_primary_promo: boolean
      - discounted_targets: JSON
      - badge_label: optional text
      - description: optional text
      - starts_at: optional datetime
      - ends_at: optional datetime
      - internal_note: optional text
  - discounted_targets JSON shape:

  [
    {
      "tab": "cpucooler",
      "product_id": "8298720854153",
      "variant_id": "",
      "qty": 1,
      "label": "Cooler Master MasterLiquid 360L Core ARGB Black",
      "discount_amount": 600
    }
  ]

  There are minor changes that we want. 
  1. since we have the add on discount if there's an applicable discount when detected. it should show on ucp-pcb__cell ucp-pcb__cell--price. it should function like how it would on the bundle discount. ucp-pcb__bundleNote it should have something like this. but write addon discount or whatever you think is better in terms of persuasiveness.
  2. ucp-pcb__totalsRow on this row, CPU Cooler Addon Discount • Thermalright Peerless Assassin 120 SE it should only display the promo label. don't include the name of the item. 
  3. i think something happened how the ucp-pcb__bundleNote operates. the ucp-pcb__bundleNote should show the bundle save when I already have the CPU on my build summary. the ucp-pcb__bundleNote on shows when I add the specific motherboard.  D:\Prince\Shopify App\notes.md check this files. I have the CPU on the build summary but does not show the bundle save amount. that's how it should also work for the add on discount. D:\Prince\Shopify App\Price list\image.png this is the current version the bundle save amount only shows when I already have a motherboard on the build summary 



  let's create a change for the UI on the FPS Finder
  1. I want to make the FPS Finder more immersive. Make it feel like an Gamer's Den Design. 
  2. RGB Aura Glow: used soft gradients that bleed behind the cards, mimicking how RGB strips reflect off walls in a dark gaming setup.
  3. I've also included a banner for each game metaobject
  Name: Banner 
  key: banner
  4. Glassmorphic Surfaces: Components or Games are housed in frosted, translucent containers that feel high-end and modern.
  5. These are the initial designs that I had in mind can you make it more immersive that's still inline with how the function of the FPS Finder is. 

ucp-fpsf__field Compare Resolution  can you make them inline with each other
anjd ucp-fpsf__field Compare Preset can you make them inline with each other
so its 
 - compare res 1080 1440
 - preset low med high

for the game list ucp-fpsf__component-compare-games-list specifically the pill data-component-compare-game 
can you make it into 1 line but in carousel mode. then inside the pill are the logo of the game, then the name of the game

ucp-fpsf__component-compare-row
ucp-fpsf__component-compare-row-title can you place the logo before the name title 
ucp-fpsf__component-compare-delta and on the delta can you make it a percentage type. but make sure to emphasize that these are not indicative of real FPS. just a ballpark figure.

also in order for us to not get flamed by this. can we try to give out a advisory that this part of our website is just a beta version and we're still improving our website. this just helps us understand the heirarchy of the CPU and GPU that these hardware gives. take it with a grain of salt. so don't take it into heart. - improve on this and make sure that they get this.


----

ucp-fpsf__component-compare-pair-state lets remove this Pair A benchmark rows are ready for the selected games and this Pair B benchmark rows are ready for the selected games.
beta advisory can we just show a modal at the start to make sure that they see it
ucp-fpsf__field ucp-fpsf__component-compare-filterRow compare resolution is not inline. can you make the boxes smaller. ucp-fpsf__resolution is-active for both preset and resolution pill picker. 

and you have 2  ucp-fpsf__compare-trigger is-active or Back to Browse button can we just have 1

and for the horizontal scrollbar for the ucp-fpsf__component-compare-games-list can you change how it looks also. make it inline with the theme
 


 can you place the compare button on top of the ucp-fpsf__controls ucp-fpsf__controls--component then make it a toggle between single pair or compare mode (or whatever its called) default is the compare mode. 
 for the single mode can you also do the same design as the compare mode, meaning making the resolution and presets inline with all of their options 
 adding a logo on top of the ucp-fpsf__component-game is-awaiting_pair 
 also remove this ucp-fpsf__component-game-state the select pair text
 ucp-fpsf__component-compare-beta-modal-title and instead of component compare is in beta, can we say that FPS Finder is in beta "GPU hierarchy plus ballpark FPS gaps" "GPU hierarchy plus estimate FPS gaps" or whatever is more sensible 
also what can be a better name that FPS Finder? 



from the PC builder Addon discount What we're going to do is we're gonna add upon another discount if they plan on buying the bulk so let's say if they have completed different let's say if they have completed the PC Builder or that let's say if they have chosen at least three other components from the PC Builder so we want to unlock the discount that we can give to our customers just in case that to promote a much better deal for them So right now what we currently have is An add on for the CPU cooler whenever they by the bundle or probably the promo that is available on our website right

So what we wanted to do next is probably let's say if they already have CPU motherboard RAM CPU cooler It would also unlock the other discount for the other components so let's say if they have bought 4 of them it would unlock This counts for the GPU case power supply and other components so that's what I have in mind and how should we structure that for the PC builder



 # PC Builder Bulk Add-On Discount Structure

  ## Summary

  Extend the existing pc_builder_addon_discount system instead of creating a new discount type. The new behavior will let an add-on discount unlock when the shopper has selected enough qualifying PC Builder component
  categories, for example CPU + motherboard + RAM + CPU cooler, then apply discounts to configured target parts like GPU, case, PSU, SSD, fans, or other items.

  This keeps bundle discounts, promo discounts, and current CPU-cooler add-on discounts working as they are.

  ## Key Changes

  ### Shopify Metaobject Fields

  Add these fields to the existing pc_builder_addon_discount metaobject:

  - bulk_unlock_enabled
      - Type: boolean
      - Purpose: allows this add-on discount rule to unlock from selected component count
  - bulk_qualifying_tabs
      - Type: JSON
      - Example:

        ["processor", "motherboard", "memory", "cpucooler"]

      - Purpose: defines which selected PC Builder tabs count toward the unlock

  - bulk_min_qualifying_tabs
      - Type: integer
      - Example: 4
      - Purpose: how many of the qualifying tabs must be selected before the rule unlocks

  Recommended tab keys:
  processor, motherboard, memory, gpu, ssd, cpucooler, case, powersupply, casefans, other.

  ### Rule Behavior

  A pc_builder_addon_discount rule unlocks if any of these is true:

  - existing unlock_on_bundle_discount condition passes
  - existing unlock_on_any_primary_promo or qualifying_promo_handles condition passes
  - new bulk condition passes:
      - bulk_unlock_enabled = true
      - selected unique qualifying tabs count is at least bulk_min_qualifying_tabs

  Example:

  bulk_qualifying_tabs = ["processor", "motherboard", "memory", "cpucooler"]
  bulk_min_qualifying_tabs = 4

  This means the customer must select CPU, motherboard, RAM, and CPU cooler before the rule unlocks.

  ### Discount Targets

  Keep using the existing discounted_targets JSON.

  Example for a bulk-unlocked PSU/GPU/case discount:

  [
    {
      "tab": "gpu",
      "product_id": "123456789",
      "variant_id": "",
      "qty": 1,
      "label": "GPU bulk build discount",
      "discount_amount": 1000
    },
    {
      "tab": "powersupply",
      "product_id": "987654321",
      "variant_id": "",
      "qty": 1,
      "label": "PSU bulk build discount",
      "discount_amount": 500
    },
    {
      "tab": "case",
      "product_id": "555555555",
      "variant_id": "",
      "qty": 1,
      "label": "Case bulk build discount",
      "discount_amount": 500
    }
  ]

  The discount only applies when the target item is actually selected.

  ## Implementation Plan

  - Update the embedded add-on rules in PC Builder 2/sections/ucp-pc-builder.liquid and the paginated endpoint page.ucp-pcb-addon-discounts-json.liquid to output the three new bulk fields.
  - Extend add-on rule normalization in ucp-pc-builder.js to parse the new fields.
  - Add a helper that counts selected unique qualifying tabs from state.picked.
  - Extend ucpAddonRuleUnlocks_() so bulk unlocks work alongside existing bundle/promo unlocks.
  - Keep existing totals, quote image, approval modal, saved build snapshot, and Google Sheets logging working through the existing addonDiscountRows, addonRuleHandles, and addonRuleLabels.

  ## UI Behavior

  - Existing add-on discount display stays the same:
      - product price cell shows Addon save
      - totals row shows the rule label and discount amount
      - quote image and approval modal include the add-on discount rows
  - For naming clarity, set promo_label on bulk rules to something customer-friendly like:
      - Full Build Discount
      - Bulk Build Savings
      - Complete Build Add-On Discount

  ## Test Plan

  - Existing CPU-cooler add-on discount still unlocks from bundle/promo as before.
  - A bulk rule with CPU + motherboard + RAM + cooler required does not unlock with only 3 tabs selected.
  - The same rule unlocks after all 4 qualifying tabs are selected.
  - Target discounts only apply when the discounted target item is selected.
  - Removing one qualifying tab removes the bulk discount.
  - Removing the target item removes that target discount.
  - Multiple add-on discount rules can stack through the existing add-on discount system.
  - Totals, quote screenshot, approval modal, saved builds, and Google Sheets logs still show add-on discount rows correctly.

  - We will not create a new pc_builder_bulk_discount metaobject for now.
  - Bulk unlock does not require a CPU + motherboard bundle or primary promo.
  - The bulk rule counts unique selected component tabs, not item quantity.
  - memory, casefans, and other count as selected when at least one item exists in that tab.
  - The existing discounted_targets JSON remains the place where discounted GPU, case, PSU, or other target items are defined.

  Zotac Gaming GeForce RTX 5050 8GB Twin Edge OC	₱1,000.00	GPU
Zotac Gaming GeForce RTX 5050 8GB Twin Edge OC White	₱1,000.00	GPU
Zotac Gaming GeForce RTX 5050 8GB Low Profile	₱1,000.00	GPU
Zotac Gaming GeForce RTX 5050 8GB Solo	₱1,000.00	GPU
Zotac Gaming GeForce RTX 5060 8GB AMP	₱1,100.00	GPU
Zotac Gaming GeForce RTX 5060 8GB Solo	₱1,000.00	GPU
Zotac Gaming GeForce RTX 5060 8GB Twin Edge OC	₱1,200.00	GPU
Zotac Gaming GeForce RTX 5060 8GB Twin Edge OC White Edition	₱1,200.00	GPU
Zotac Gaming GeForce RTX 5060 Ti 8GB Twin Edge	₱1,000.00	GPU
Zotac Gaming GeForce RTX 5060 Ti 8GB Twin Edge OC	₱1,300.00	GPU
Zotac Gaming GeForce RTX 5060 Ti 16GB Twin Edge OC	₱1,000.00	GPU
Zotac Gaming GeForce RTX 5060 Ti 16GB Twin Edge OC White Edition	₱1,500.00	GPU
Zotac Gaming GeForce RTX 5070 Twin Edge OC 12GB	₱1,800.00	GPU
Zotac Gaming GeForce RTX 5070 AMP White Edition	₱1,800.00	GPU
Zotac Gaming GeForce RTX 5070 Solid OC 12GB	₱2,000.00	GPU
Zotac Gaming GeForce RTX 5070 Ti Solid SFF OC 16GB	₱3,100.00	GPU
Zotac Gaming GeForce RTX 5080 Solid Core OC		GPU
Zotac Gaming GeForce RTX 5080 Solid OC White		GPU
PowerColor Hellhound AMD Radeon RX 9060 XT 16GB	₱1,100.00	GPU
PowerColor Hellhound Spectral White AMD Radeon RX 9060 XT 16GB	₱1,100.00	GPU
PowerColor Reaper AMD Radeon RX 9060 XT 16GB	₱1,300.00	GPU
PowerColor Red Devil AMD Radeon RX 9070 XT 16GB	₱2,200.00	GPU
PowerColor Hellhound AMD Radeon RX 9070 XT 16GB	₱2,100.00	GPU
PowerColor Hellhound Spectral White AMD Radeon RX 9070 XT 16GB	₱2,200.00	GPU
PowerColor Hellhound RX 9070 XT 16GB GDDR6 Reva Edition	₱2,800.00	GPU
PowerColor Reaper RX 9070 XT 16GB GDDR	₱2,700.00	GPU
XFX Swift AMD Radeon RX 9060 XT OC Gaming Ed. 16GB	₱1,300.00	GPU
XFX Swift AMD Radeon RX 9060 XT OC White Gaming Edition 16GB	₱1,400.00	GPU
XFX Swift AMD Radeon RX 9060 XT OC Triple Fan Gaming Ed. 16GB	₱1,200.00	GPU
XFX Swift AMD Radeon RX 9060 XT OC Triple Fan Gaming Ed. 16GB White	₱1,400.00	GPU
XFX Swift RX 9070XT Triple fan Gaming Edition with 16GB	₱1,900.00	GPU
XFX Swift RX 9070XT White Triple fan Gaming Edition with 16GB	₱2,000.00	GPU
XFX Mercury RX 9070XT OC Magnetic Air RGB with 16GB	₱1,500.00	GPU
XFX Mercury AMD Radeon RX 9070XT OC White Magnetic Air Edition with RGB	₱2,800.00	GPU
XFX Mercury RX 9070XT OC White Magnetic Air RGB with 16GB	₱1,700.00	GPU
XFX Mercury Radeon RX 9070XT OC Gaming Edition with RGB 16GB	₱2,700.00	GPU
XFX Quicksilver RX 9070XT White Gaming Edition with 16GB	₱2,400.00	GPU
		
		
DeepCool AK620	₱200.00	CPU Cooler
DeepCool AK400 White	₱50.00	CPU Cooler
DeepCool Assassin IV	₱250.00	CPU Cooler
DeepCool Assassin IV White	₱250.00	CPU Cooler
DeepCool AN600	₱100.00	CPU Cooler
DeepCool Assassin IV VC Vision	₱300.00	CPU Cooler
DeepCool AK500S Digital SE White	₱50.00	CPU Cooler
DeepCool AK400 G2	₱100.00	CPU Cooler
DeepCool AK400 G2 White	₱100.00	CPU Cooler
DeepCool AK500 G2	₱100.00	CPU Cooler
DeepCool AK500 G2 White	₱100.00	CPU Cooler
DeepCool AK620 G2	₱150.00	CPU Cooler
DeepCool AK620 G2 White	₱150.00	CPU Cooler
DeepCool AK400 G2 Digital NYX	₱100.00	CPU Cooler
DeepCool AK700 Digital NYX	₱150.00	CPU Cooler
DeepCool LT360 ARGB	₱350.00	CPU Cooler
DeepCool LT360 ARGB White	₱350.00	CPU Cooler
DeepCool LS720S Zero Dark	₱250.00	CPU Cooler
DeepCool LS720 SE	₱300.00	CPU Cooler
DeepCool LS520 SE Digital	₱250.00	CPU Cooler
DeepCool LD240	₱250.00	CPU Cooler
DeepCool LD240 White	₱250.00	CPU Cooler
DeepCool LD360	₱300.00	CPU Cooler
DeepCool LD360 White	₱300.00	CPU Cooler
DeepCool LQ240	₱300.00	CPU Cooler
DeepCool LE240 White V2	₱200.00	CPU Cooler
DeepCool LE240 V2 Zero Dark	₱150.00	CPU Cooler
DeepCool LE360 v2 Zero Dark	₱150.00	CPU Cooler
DeepCool LE360 V2	₱250.00	CPU Cooler
DeepCool LE360 White V2	₱250.00	CPU Cooler
DeepCool LM240	₱200.00	CPU Cooler
DeepCool LM240 White	₱200.00	CPU Cooler
DeepCool LM360	₱250.00	CPU Cooler
DeepCool LM360 White	₱250.00	CPU Cooler
DeepCool CH560 Digital	₱250.00	Case
DeepCool CH560 White Digital	₱300.00	Case
DeepCool CH780	₱450.00	Case
DeepCool CH780 White	₱500.00	Case
DeepCool CH360 White	₱200.00	Case
DeepCool CH360 Digital	₱200.00	Case
DeepCool CH360 Digital White	₱200.00	Case
DeepCool CH160 Mesh White	₱150.00	Case
DeepCool CH170 Plus	₱150.00	Case
DeepCool CH170 Digital	₱150.00	Case
DeepCool CH170 Digital White	₱150.00	Case
DeepCool CH270 Digital	₱200.00	Case
DeepCool CH270 Digital White	₱200.00	Case
DeepCool CH690 Digital White	₱300.00	Case
DeepCool CG580 4F V2	₱250.00	Case
DeepCool CG580 4F V2 White	₱250.00	Case
DeepCool CL6600	₱500.00	Case
DeepCool CL6600 White	₱600.00	Case
DeepCool PL550D-V2	₱150.00	PSU
DeepCool PL650D-V2	₱150.00	PSU
DeepCool PN750M	₱250.00	PSU
DeepCool PX1000-G	₱450.00	PSU
		
		
Lian Li Lancool 205M Mesh Black	₱150.00	Case
Lian Li Lancool II Mesh C Performance-X Black	₱300.00	Case
Lian Li A3 White	₱200.00	Case
Lian Li O11 Air Mini White	₱300.00	Case
Lian Li O11D Evo XL Black	₱600.00	Case
Lian Li O11D Evo XL White	₱600.00	Case
Lian Li O11D Evo RGB White	₱600.00	Case
Lian Li O11D Evo Grey	₱500.00	Case
Lian Li O11 Vision Chrome	₱450.00	Case
Lian Li O11 Vision Compact Black	₱350.00	Case
Lian Li O11 Vision Compact White	₱350.00	Case
Lian Li O11D Mini v2 White	₱250.00	Case
Lian Li SL Infinity 120-3 White Cooler	₱250.00	Case Fans
Lian Li SL Infinity 120-3 Black Cooler	₱250.00	Case Fans
Lian Li AL120V2-3B Black Cooler	₱250.00	Case Fans
Lian Li AL120V2-3W White Cooler	₱250.00	Case Fans
Lian Li Uni Fan P28 Black set of 3	₱200.00	Case Fans
Lian Li Uni Fan P28 White set of 3	₱200.00	Case Fans
Lian Li UNI FAN TL WIRELESS 120 Black (3pcs)	₱250.00	Case Fans
Lian Li UNI FAN TL WIRELESS 120 White (3pcs)	₱250.00	Case Fans
Lian Li UNI FAN TL WIRELESS Reverse 120 White (3pcs)	₱250.00	Case Fans
Lian Li UNI FAN TL WIRELESS LCD 120 Black (3pcs)	₱400.00	Case Fans
Lian Li UNI FAN TL WIRELESS LCD 120 White (3pcs)	₱400.00	Case Fans
Lian Li UNI FAN CL WIRELESS 120 White (3pcs)	₱150.00	Case Fans
Lian Li UNI FAN SL-INF Wireless 120 Black (3pc)	₱250.00	Case Fans
Lian Li UNI FAN SL-INF Wireless 120 White (3pc)	₱250.00	Case Fans
Lian Li UNI FAN SL-INF Wireless Reverse 120 Black (3pc)	₱250.00	Case Fans
Lian Li Edge Gold 750W Black	₱250.00	PSU
Lian Li GA II Lite Performance 240 Black	₱200.00	CPU Cooler
Lian Li GA II Lite Performance 360 Black	₱250.00	CPU Cooler
		
		
Montech Air 100 ARGB Black	₱150.00	Case
Montech Air 1000 Lite Black	₱150.00	Case
Montech X3 Mesh White	₱150.00	Case
Montech Air 1000 Lite White	₱150.00	Case
Montech Sky Two Morocco Blue	₱250.00	Case
Montech Metal DT24 Base	₱150.00	CPU Cooler
Montech King 95 Black	₱300.00	Case
Montech Air 903 Base White	₱200.00	Case
Montech Air 903 Max Black	₱200.00	Case
Montech Air 903 Max White	₱200.00	Case
Montech AX120 PWM Black		Case Fans
Montech AX120 PWM White		Case Fans
Montech AX140 PWM Black		Case Fans
Montech AX140 PWM White		Case Fans
Montech RX120 PWM Black		Case Fans
Montech RX120 PWM White		Case Fans
Montech Hyperflow ARGB 360 Black	₱250.00	CPU Cooler
Montech Hyperflow ARGB 360 White	₱250.00	CPU Cooler
Montech Hyperflow ARGB 240 Black	₱200.00	CPU Cooler
Montech Hyperflow ARGB 240 White	₱200.00	CPU Cooler
Montech Sky Two GX Black	₱200.00	Case
Montech Sky Two GX White	₱250.00	Case
Montech X3 Glass Black	₱100.00	Case
Montech X3 Glass White	₱150.00	Case
Montech King 65 Pro Black	₱250.00	Case
Montech King 65 Pro White	₱300.00	Case
Montech HS01 Pro Black	₱300.00	Case
Montech HS01 Pro White	₱300.00	Case
Montech HS02 Pro Black	₱350.00	Case
Montech HS02 Pro White	₱350.00	Case
Montech X5 Black	₱150.00	Case
Montech X5 White	₱150.00	Case
Montech X5M Black	₱150.00	Case
Montech X5M White	₱150.00	Case
Montech XR Wood Black	₱150.00	Case
Montech XR Wood White	₱200.00	Case
Montech NX400 ARGB Black		CPU Cooler
Montech NX400 ARGB White		CPU Cooler
		
		
NZXT Kraken RGB 240mm Black	₱450.00	CPU Cooler
NZXT Kraken RGB 240mm White	₱450.00	CPU Cooler
NZXT H7 White	₱300.00	Case
NZXT H7 Elite Black	₱550.00	Case
NZXT H7 Flow RGB White	₱400.00	Case
NZXT H9 Flow (2025) Black	₱450.00	Case
NZXT H9 Flow (2025) White	₱450.00	Case
NZXT H9 Flow RGB Black	₱500.00	Case
NZXT H9 Flow RGB White	₱500.00	Case
		
		
Seasonic B12 BM-650	₱200.00	PSU
Seasonic B12 BM-750	₱200.00	PSU
Seasonic Vertex GX-750	₱500.00	PSU
Seasonic Vertex GX-850	₱550.00	PSU
Seasonic Vertex GX-1000	₱650.00	PSU
Seasonic Focus Plus Gold 1000W ATX 3.0	₱500.00	PSU
Seasonic Focus Plus Gold 750W ATX 3.0	₱400.00	PSU
Seasonic Focus Plus Gold 850W ATX 3.0	₱450.00	PSU
Seasonic Focus Plus Gold 750W ATX 3.0 White	₱399.95	PSU
Seasonic Focus Plus Gold 850W ATX 3.0 White	₱450.00	PSU
Seasonic Focus Plus Gold 1000W ATX 3.0 White	₱550.00	PSU