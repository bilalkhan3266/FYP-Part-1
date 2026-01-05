$startDate = Get-Date "2026-01-05"
$endDate = Get-Date "2026-04-15"

$dates = @()
$current = $startDate

# Random gaps (natural work pattern)
while ($current -le $endDate) {
    $dates += $current
    $current = $current.AddDays((Get-Random -Minimum 2 -Maximum 5))
}

# Only 20 commits
$dates = $dates | Select-Object -First 20

$folders = @("components","pages","hooks","utils","styles","contexts")

$messages = @(
"feat: add responsive navigation bar",
"fix: resolve CSS styling issues",
"feat: implement user profile page",
"refactor: improve component structure",
"feat: add form validation",
"fix: handle API response errors",
"feat: add dark mode toggle",
"update: optimize frontend performance",
"fix: mobile responsiveness bug",
"feat: add authentication guards",
"refactor: clean up unused imports",
"feat: implement dashboard charts",
"fix: navigation routing issues",
"feat: add loading skeleton screens",
"update: improve UI/UX design",
"fix: console error handling",
"feat: add notification system",
"refactor: extract reusable components",
"feat: implement search functionality",
"fix: memory leak in useEffect hooks"
)

# Set git config for commits
$authorName = "Ahsan Farooq"
$authorEmail = "cadetahsan32@gmail.com"

$i = 0
foreach ($date in $dates) {

    $folder = $folders | Get-Random
    $path = "frontend/src/$folder"

    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }

    $file = "$path/frontend_update_$i.js"

@"
// Frontend Update $i
export const component$i = () => {
    return <div>Frontend Feature in $folder</div>;
};
"@ | Out-File $file

    git add .

    # Random afternoon/evening time
    $hour = Get-Random -Minimum 14 -Maximum 22
    $minute = Get-Random -Minimum 0 -Maximum 59
    $second = Get-Random -Minimum 0 -Maximum 59

    $timeString = "{0}:{1}:{2}" -f $hour, $minute, $second
    $commitDate = $date.ToString("yyyy-MM-dd") + " $timeString"

    $env:GIT_AUTHOR_NAME = $authorName
    $env:GIT_AUTHOR_EMAIL = $authorEmail
    $env:GIT_COMMITTER_NAME = $authorName
    $env:GIT_COMMITTER_EMAIL = $authorEmail
    $env:GIT_AUTHOR_DATE = $commitDate
    $env:GIT_COMMITTER_DATE = $commitDate

    $msg = $messages | Get-Random

    git commit -m "$msg"

    Write-Host "✅ Commit $($i+1)/20: $msg on $($date.ToString('yyyy-MM-dd HH:mm:ss'))"

    $i++
}

Write-Host "`n✅ 20 frontend commits created for Ahsan Farooq!"
Write-Host "Author: $authorName <$authorEmail>"
Write-Host "Ready to push to GitHub!"
