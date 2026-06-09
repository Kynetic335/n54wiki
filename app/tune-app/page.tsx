/**
 * /tune-app — preferred route alias for the Tune App (formerly Tune Program).
 * Renders the same page component so both /tune-app and /tune-program work.
 * Sub-routes (/tune-program/intake, /packages, etc.) remain at their original paths.
 */
export { default } from '@/app/tune-program/page'
export { metadata } from '@/app/tune-program/page'
