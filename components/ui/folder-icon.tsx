export default function FolderIcon({ open = false }: { open?: boolean }) {
  return open ? (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="6" width="18" height="10" rx="3" fill="#FFE082"/>
      <rect x="2" y="4" width="8" height="4" rx="2" fill="#FFD54F"/>
      <rect x="2" y="6" width="18" height="2" rx="1" fill="#FFECB3"/>
    </svg>
  ) : (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="6" width="18" height="10" rx="3" fill="#FFD54F"/>
      <rect x="2" y="4" width="8" height="4" rx="2" fill="#FFE082"/>
      <rect x="2" y="6" width="18" height="2" rx="1" fill="#FFECB3"/>
    </svg>
  );
}
