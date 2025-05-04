function convertDateToUnixTime(date:Date) {
    const unixTime = Math.floor(
        date.getTime() / 1000
    )

    return unixTime
}

export {
    convertDateToUnixTime
}