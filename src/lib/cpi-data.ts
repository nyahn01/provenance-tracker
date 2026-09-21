/**
 * US consumer price index, annual average, 1967 = 100.
 *
 * Source: Federal Reserve Bank of Minneapolis, "Consumer Price Index, 1800–",
 * https://www.minneapolisfed.org/about-us/monetary-policy/inflation-calculator/consumer-price-index-1800-
 *
 * The Fed splices five series to cover 1800–present: the Vermont Farmers'
 * index (1800–51), Ethel D. Hoover's CPI (1851–90), Albert Rees' Cost of
 * Living Index (1890–1912), the BLS's official CPI (1913–77), and CPI-U
 * (1978–present). Only 1913 onward is official, measured CPI — everything
 * before it is a historical reconstruction the source itself calls an
 * estimate, which is why CPI_ESTIMATE_CUTOFF_YEAR exists below.
 *
 * Range kept here: 1872 (the Knoedler stock books' first year) through 2025
 * (the source's latest finalized annual average — 2026 is a partial-year
 * estimate in the source and is deliberately left out).
 */

export const CPI_BASE_YEAR = 1967
export const CPI_SOURCE_LABEL = 'Federal Reserve Bank of Minneapolis — Consumer Price Index, 1800–present'
export const CPI_SOURCE_URL =
  'https://www.minneapolisfed.org/about-us/monetary-policy/inflation-calculator/consumer-price-index-1800-'

/** Years at or after this use official, measured CPI. Earlier years are a historical reconstruction. */
export const CPI_ESTIMATE_CUTOFF_YEAR = 1913

/** Latest finalized annual average in the source; the "today" side of every adjustment. */
export const CPI_PRESENT_YEAR = 2025

export const CPI_ANNUAL_INDEX: Readonly<Record<number, number>> = Object.freeze({
  1872: 36, 1873: 36, 1874: 34, 1875: 33, 1876: 32, 1877: 32, 1878: 29, 1879: 28,
  1880: 29, 1881: 29, 1882: 29, 1883: 28, 1884: 27, 1885: 27, 1886: 27, 1887: 27,
  1888: 27, 1889: 27, 1890: 27, 1891: 27, 1892: 27, 1893: 27, 1894: 26, 1895: 25,
  1896: 25, 1897: 25, 1898: 25, 1899: 25, 1900: 25, 1901: 25, 1902: 26, 1903: 27,
  1904: 27, 1905: 27, 1906: 27, 1907: 28, 1908: 27, 1909: 27, 1910: 28, 1911: 28,
  1912: 29, 1913: 29.7, 1914: 30.1, 1915: 30.4, 1916: 32.7, 1917: 38.5, 1918: 45.2,
  1919: 52.1, 1920: 60.2, 1921: 53.6, 1922: 50.3, 1923: 51.2, 1924: 51.5, 1925: 52.7,
  1926: 53.2, 1927: 52.2, 1928: 51.6, 1929: 51.6, 1930: 50.2, 1931: 45.7, 1932: 41.0,
  1933: 38.9, 1934: 40.2, 1935: 41.2, 1936: 41.7, 1937: 43.2, 1938: 42.3, 1939: 41.8,
  1940: 42.1, 1941: 44.2, 1942: 49.1, 1943: 52.0, 1944: 52.9, 1945: 54.1, 1946: 58.6,
  1947: 67.1, 1948: 72.2, 1949: 71.5, 1950: 72.3, 1951: 78.0, 1952: 79.8, 1953: 80.4,
  1954: 80.7, 1955: 80.5, 1956: 81.7, 1957: 84.4, 1958: 86.7, 1959: 87.6, 1960: 88.9,
  1961: 89.8, 1962: 90.9, 1963: 92.0, 1964: 93.2, 1965: 94.7, 1966: 97.5, 1967: 100.2,
  1968: 104.5, 1969: 110.2, 1970: 116.7, 1971: 121.7, 1972: 125.7, 1973: 133.4,
  1974: 148.2, 1975: 161.7, 1976: 171.0, 1977: 182.1, 1978: 196.0, 1979: 218.1,
  1980: 247.6, 1981: 273.2, 1982: 290.0, 1983: 299.3, 1984: 312.2, 1985: 323.2,
  1986: 329.4, 1987: 341.4, 1988: 355.4, 1989: 372.5, 1990: 392.6, 1991: 409.3,
  1992: 421.7, 1993: 434.1, 1994: 445.4, 1995: 457.9, 1996: 471.3, 1997: 482.4,
  1998: 489.8, 1999: 500.6, 2000: 517.5, 2001: 532.1, 2002: 540.5, 2003: 552.8,
  2004: 567.6, 2005: 586.9, 2006: 605.8, 2007: 623.1, 2008: 647.0, 2009: 644.7,
  2010: 655.3, 2011: 676.0, 2012: 689.9, 2013: 700.0, 2014: 711.4, 2015: 712.3,
  2016: 721.2, 2017: 736.6, 2018: 754.6, 2019: 768.3, 2020: 777.7, 2021: 814.3,
  2022: 879.4, 2023: 915.6, 2024: 942.7, 2025: 967.5,
})
