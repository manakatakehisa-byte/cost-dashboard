data.push({
        yearMonth: ym,
        year,
        factory:      r[col.factory] || '',
        itemCode:     r[col.itemCode] || '',
        inspQty:      Math.round(toNum(r[col.inspQty])),
        defectQty:    Math.round(toNum(r[col.defectQty])),
        inspCost:     Math.round(toNum(r[col.inspCost])),
        packCost:     Math.round(toNum(r[col.packCost])),
        diffInspPack: Math.round(toNum(r[col.diffInspPack])),
        base:         Math.round(toNum(r[col.base])),
        diffInspBase: Math.round(toNum(r[col.diffInspBase])),
      })
