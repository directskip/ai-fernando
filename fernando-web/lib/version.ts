/**
 * Version tracking utility
 * Provides build version info based on git commit/branch
 */

export interface VersionInfo {
  version: string
  commit: string
  branch: string
  buildTime: string
}

// This will be populated at build time
export function getVersionInfo(): VersionInfo {
  return {
    version: process.env.NEXT_PUBLIC_VERSION || '4.0.0',
    commit: process.env.NEXT_PUBLIC_COMMIT_SHA || 'dev',
    branch: process.env.NEXT_PUBLIC_GIT_BRANCH || 'local',
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
  }
}

export function getShortVersion(): string {
  const info = getVersionInfo()
  const shortCommit = info.commit.substring(0, 7)

  if (info.branch === 'main') {
    return `v${info.version}`
  }

  return `v${info.version}-${info.branch}.${shortCommit}`
}
