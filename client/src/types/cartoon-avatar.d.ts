declare module 'cartoon-avatar' {
  /** CommonJS package — use the default import. Note: the image-count
   * constants live in the package's internal config and are NOT exported. */
  interface CartoonAvatar {
    /** Returns a hosted cartoon avatar image URL. Random gender/id when omitted. */
    generate_avatar(options?: { gender?: 'male' | 'female' | 'm' | 'f'; id?: number }): string;
  }
  const cartoonAvatar: CartoonAvatar;
  export default cartoonAvatar;
}
