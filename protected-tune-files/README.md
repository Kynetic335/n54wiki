# protected-tune-files/

This directory holds actual MHD N54 tune BIN files served **server-side only**.

## Rules

- Files in this directory are **NEVER** served from `public/`
- Files are **NEVER** exposed via public URLs
- This directory is **NOT** committed to the repository (`.gitignore`)
- Files are read server-side in the export API route only

## Structure

```
protected-tune-files/
  I8A0S/
    stage1/
      91/  n54-i8a0s-s1-91-stock.bin
      93/  n54-i8a0s-s1-93-stock.bin
      e30/ n54-i8a0s-s1-e30-stock.bin
    stage2/
      93/  n54-i8a0s-s2-93-stock.bin
      ...
    stage3/
      e30/ n54-i8a0s-s3-e30-upgraded.bin
      ...
    hybrid-base/
      e30/ n54-i8a0s-hybrid-base-e30.bin
      ...
  IJE0S/
    ...
  INA0S/
    ...
```

## Mapping files

1. Place the actual BIN file at the path shown in `data/tune-program/tuneFiles.ts`
2. Set `fileExists: true` for that entry in the registry
3. Test the export API with `SYNERGY_EXPORT_SECRET` set

## Security

Files are encrypted with AES-256-GCM before being sent to the admin.
The exported `.synergytune` package is:
- Not directly readable without the Synergy decryption tool
- Protected against casual copying/reading
- Not a guarantee of absolute security

**Do not place raw tune files in `public/`.**
