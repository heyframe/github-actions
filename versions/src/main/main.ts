import * as core from '@actions/core';
import { execSync } from 'child_process';
import semver from 'semver';

function getTags(): string[] {
    const out = execSync(
        'git ls-remote --refs --sort="version:refname" --tags https://github.com/heyframe/heyframe',
        { encoding: 'utf-8' }
    );

    return out
        .split('\n')
        .map(line => line.split('/').pop()!)
        .filter(tag => tag && !tag.match(/dev|beta|alpha/i));
}

function getTagsWithoutRC(tags: string[]): string[] {
    return tags.filter(tag => !tag.match(/rc/i));
}

function getFirstAndLast(tags: string[], prefix: string) {
    const filtered = tags.filter(t => t.startsWith(prefix));
    return {
        first: filtered[0] ?? '',
        last: filtered[filtered.length - 1] ?? ''
    };
}

function getNextVersions(latest: string) {
    const parsed = semver.parse(latest);
    if (!parsed) throw new Error(`Invalid semver: ${latest}`);
    const nextMinor = `${parsed.major}.${parsed.minor + 1}.0`;
    const nextPatch = `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    return { nextMinor, nextPatch };
}

// 获取输入
const major = core.getInput('major') || 'v6.7.';
const ltsMajor = core.getInput('lts-major') || 'v6.6.';

const tags = getTags();
const tagsNoRC = getTagsWithoutRC(tags);

// 当前 major
const cur = getFirstAndLast(tagsNoRC, major);
const curNext = getNextVersions(cur.last);

// LTS major
const lts = getFirstAndLast(tagsNoRC, ltsMajor);
const ltsNext = getNextVersions(lts.last);

// 输出
core.setOutput('first-version', cur.first);
core.setOutput('latest-version', cur.last);
core.setOutput('next-minor', curNext.nextMinor);
core.setOutput('next-patch', curNext.nextPatch);

core.setOutput('lts-first-version', lts.first);
core.setOutput('lts-latest-version', lts.last);
core.setOutput('lts-next-patch', ltsNext.nextPatch);
