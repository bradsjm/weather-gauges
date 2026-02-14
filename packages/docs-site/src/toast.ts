type ToastTone = 'info' | 'warning'

const toneLabel = (tone: ToastTone): string => {
  if (tone === 'warning') {
    return 'Note'
  }
  return 'Info'
}

export const showToast = (message: string, tone: ToastTone = 'info'): void => {
  const host = document.querySelector<HTMLDivElement>('#toast-host')
  if (!host) {
    return
  }

  const item = document.createElement('div')
  item.className = `toast toast-${tone}`
  item.setAttribute('role', 'status')
  item.innerHTML = `<strong>${toneLabel(tone)}:</strong> ${message}`
  host.append(item)

  window.setTimeout(() => {
    item.classList.add('toast-out')
    window.setTimeout(() => item.remove(), 520)
  }, 1800)
}
