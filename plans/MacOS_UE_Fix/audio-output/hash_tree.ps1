# hash_tree.ps1 -Root <dir> : prints "<md5 lowercase>  ./<relative path with forward slashes>" for every file, sorted,
# in the same format as `find . -type f | sort | xargs md5sum`, so a copy can be compared with its source.
param([Parameter(Mandatory = $true)][string]$Root)
$rootFull = (Resolve-Path $Root).Path.TrimEnd('\')
Get-ChildItem -Path $rootFull -Recurse -File | ForEach-Object {
    $rel = './' + $_.FullName.Substring($rootFull.Length + 1).Replace('\', '/')
    $h = (Get-FileHash -Algorithm MD5 -LiteralPath $_.FullName).Hash.ToLower()
    "$h  $rel"
} | Sort-Object { $_.Substring(34) } -CaseSensitive
