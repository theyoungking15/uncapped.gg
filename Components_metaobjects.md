**CPU**
CPU Core Count
Custom.cpu_core_count
Integer

CPU Base Clock
Api: custom.cpu_base_clock
Type: Decimal

CPU Boost Clock
Api: custom.cpu_boost_clock
Decimal

TDP
API: custom.tdp
Integer

Integrated Graphics
custom.integrated_graphics
list Choice list


CPU Thread Count
Custom.cpu_thread_count
Integer

Name: Processor Socket (list): AM4 or AM5
API: shopify.processor-socket
Type: List
Example Value: AM4 or AM5 (add more in the future since we')


**Motherboard**
Name: Processor Socket (list): AM4 or AM5
API: shopify.processor-socket
Type: List
Example Value: AM4 or AM5 (add others soon)

Name: Motherboard form factor
API: shopify.motherboard-form-factor
Type: Metaobjects List
Example: Mini-ITX, ATX, Micro-ATX E-AtX its just either these 4

RAM Slots
Custom.ram_slots
Integer

Motherboard Wifi
Custom.motherboard_wifi
List Choice list (Wi-Fi 5, Wi-Fi 6, Wi-Fi 6E, Wi-Fi 7)

M.2 Slots
Custom.m_2_slots
Integer

PCIe x16 Slots
Custom.pcie_x16_slots
Integer

Socket Chipset
API: custom.socket_chipset
Type: list (choice list)
X870E, X870, B850, B840, X670E, X670, B650E, B650, B620




**RAM**
Speed
Ram.speed
Integer

CAS Latency
Ram.cas_latency
Integer

Capacity
Ram.capacity
Integer

Module Count
ram.module_count
Integer

Module Capacity
ram.module_capacity
Integer

**SSD**
Read mbps
Custom.read_mbps
Integer


Write mbps
Custom.write_mbps
Integer

M.2 Form Factor
Custom.m_2_form_factor

**CPU Cooler**
Cooler Height
Custom.cooler_height
Integer

Cooler Radiator Size
Custom.cooler_radiator_size
Integer

**GPU**
VRAM
Gpu.vram
Integer

Memory Type
Gpu.memory_type
List (GDDR6, GDDR7)

Core Clock
Gpu.core_clock
Integer

Boost Clock
Gpu.boost_clock
Integer

Power Connector Type
Type: power_connector_type
Fields
Name
Key: name
List (8-pin PCIe, 12VHPWR, 12V-2x6, 6-pin PCIe)

Power Connector Requirement
Type: power_connector_requirement

Connector Type
Connector_type
Metaobject Reference

Count
Type: count
Integer

Power Connectors
Gpu.power_connectors
Single Line Text

Minimum PSU
Gpu.minimum_psu
Integer

Length
Gpu.length
Integer

Width
Gpu.width
Integer

Height
Gpu.height
Integer

Chipset
Gpu.chipset
List

Board Partner
Gpu.board_partner
One metaobject

**Power Supply**

Power Supply Metafields
Certification
Custom.certification
Single Line text

Energy efficiency class (what I deemed to place is the PSU Tier List) 
shopify.energy-efficiency-class
Metaobject Reference


Watts (should I change this to integer now? While we’re still on the building side)
Custom.watts
Single Line Text

PCIe Generation
Custom.pcie_generation
SIngle line text

Modularity
Custom.modularity
Single Line text (choice List)
Non Modular, Semi Modular, Fully Modular

**Case** 
Category metafield (list so applies to multiple)
Supported motherboard
custom.supported_motherboard
Matx / Atx / Itx / Eatx

GPU Support
Custom.gpu_support
integer

Air Cooler Support
AIO Cooler Support
Front
Top

Case Fans Support
Front
Top
Bottom
