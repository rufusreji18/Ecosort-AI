export const recyclingTips = {
  recyclable: [
    {
      id: 1,
      title: "Paper & Cardboard",
      tips: [
        "Remove plastic windows from envelopes before recycling",
        "Flatten cardboard boxes to save space",
        "Remove non-paper items (tape, labels with plastic)",
        "Keep paper dry - wet paper cannot be recycled"
      ],
      icon: "📄"
    },
    {
      id: 2,
      title: "Plastic",
      tips: [
        "Rinse plastic containers before recycling",
        "Remove caps and lids (often not recyclable)",
        "Crush bottles and containers to save space",
        "Check for recycling symbol (numbers 1-7)"
      ],
      icon: "🥤"
    },
    {
      id: 3,
      title: "Glass",
      tips: [
        "Rinse glass containers thoroughly",
        "Separate by color if required in your area",
        "Remove labels and caps",
        "Avoid broken glass - it can contaminate batches"
      ],
      icon: "🍾"
    },
    {
      id: 4,
      title: "Metal",
      tips: [
        "Clean aluminum cans and tin containers",
        "Remove labels if possible",
        "Crush cans to save space",
        "Metal is infinitely recyclable!"
      ],
      icon: "🔧"
    },
    {
      id: 5,
      title: "Mixed Recyclables",
      tips: [
        "Mix different types in the same bin",
        "Keep materials clean and dry",
        "Remove food waste from containers",
        "Follow your local recycling guidelines"
      ],
      icon: "♻️"
    }
  ],
  nonRecyclable: [
    {
      id: 1,
      title: "General Waste",
      tips: [
        "Place in regular trash bin",
        "Ensure it's properly sealed in bags",
        "Don't mix with recyclable materials",
        "Follow local disposal guidelines"
      ],
      icon: "🗑️"
    },
    {
      id: 2,
      title: "Hazardous Materials",
      tips: [
        "Never put in regular trash",
        "Take to hazardous waste collection center",
        "Includes batteries, chemicals, electronics",
        "Contact your local waste authority for info"
      ],
      icon: "⚠️"
    },
    {
      id: 3,
      title: "Electronics",
      tips: [
        "Take to e-waste recycling center",
        "Contains valuable and toxic materials",
        "Many retailers accept old electronics",
        "Data should be securely wiped first"
      ],
      icon: "📱"
    },
    {
      id: 4,
      title: "Composting Option",
      tips: [
        "Organic waste can be composted",
        "Create nutrient-rich soil for gardens",
        "Reduces methane from landfills",
        "Start a compost bin at home!"
      ],
      icon: "🌱"
    }
  ]
};

export function getTipsForCategory(category) {
  if (category === "Recyclable") {
    return recyclingTips.recyclable[Math.floor(Math.random() * recyclingTips.recyclable.length)];
  } else {
    return recyclingTips.nonRecyclable[Math.floor(Math.random() * recyclingTips.nonRecyclable.length)];
  }
}

export function getAllTips(category) {
  return category === "Recyclable"
    ? recyclingTips.recyclable
    : recyclingTips.nonRecyclable;
}
