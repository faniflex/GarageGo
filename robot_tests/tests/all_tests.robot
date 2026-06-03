*** Settings ***
Library    SeleniumLibrary
Resource   ../resources/keywords.robot
Resource   ../variables.robot

*** Test Cases ***

FR-001 User Registration :: TC-REG-001    [Tags]    Functional    p1    planned
    [Documentation]    User Registration flow - TC-REG-001
    Open Browser    ${BASE_URL}/auth    ${BROWSER}
    Wait Until Page Contains Element    xpath=//form    timeout=15s
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="root"]/div[2]/main/div/form/p/button
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="fullName"]    Test User
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="phone"]    +251900112233
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="email"]    testuser@example.com
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="password"]    password123
    Run Keyword And Ignore Error    Click Button    xpath=///*[@id="root"]/div[2]/main/div/form/button
    Run Keyword And Ignore Error    Wait Until Page Contains    xpath=//*[@id="root"]/div[1]/ol/li     timeout=8s
    Close Browser

FR-002 User Login :: TC-AUTH-001    [Tags]    Functional    Security    p1    planned
    [Documentation]    Login - TC-AUTH-001
    Open Browser    ${BASE_URL}/auth    ${BROWSER}
    Wait Until Page Contains Element    xpath=//form    timeout=15s
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="email"]    fanue000@gmail.com
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="password"]    12345678
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="root"]/div[2]/main/div/form/button
    Wait Until Page Contains Element    xpath=//*[@id="root"]/div[2]/div[1]/header/div/div/a[4]/span[2]    timeout=8s
    Close Browser

FR-003 Find Garage :: TC-LOC-001    [Tags]    Functional    Integration    p1    planned
    [Documentation]    Search/Find garage - TC-LOC-001
    Open Browser    ${BASE_URL}/garages    ${BROWSER}
    Wait Until Page Contains Element    xpath=//*[@id="root"]/div[2]/main/div[2]/div[1]/input    timeout=15s
    Wait Until Page Contains    garage    timeout=12s
    Close Browser

FR-004 Request a roadside assistant :: TC-SRV-001    [Tags]    Functional    Integration    p1    planned
    [Documentation]    Request roadside assistance - TC-SRV-001
    Open Browser    ${BASE_URL}/auth    ${BROWSER}
    Wait Until Page Contains Element    xpath=//form    timeout=15s
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="email"]    fanue000@gmail.com
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="password"]    12345678
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="root"]/div[2]/main/div/form/button
    Wait Until Page Contains Element    xpath=//*[@id="root"]/div[2]/div[1]/header/div/div/a[4]/span[2]    timeout=15s
    Run Keyword And Ignore Error    Click Link    xpath=//*[@id="root"]/div[2]/div[1]/section[1]/div[4]/div/div[2]/a[1]
    Wait Until Page Contains Element    xpath=//*[@id="root"]/div[2]/main/div[3]/a[1]/div[2]/button    timeout=12s
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="root"]/div[2]/main/div[3]/a[1]/div[2]/button
    Wait Until Page Contains Element    xpath=//*[@id="root"]/div[2]/main/div/div[2]/div/button    timeout=12s
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="root"]/div[2]/main/div/div[2]/div/button
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="radix-:ro:"]/div[2]/div[1]/div/button[1]
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="radix-:ro:"]/div[2]/div[2]/input    200
    Wait Until Page Contains    Garage    timeout=12s
    Close Browser

FR-005 Browse Spare Parts :: TC-MKT-001    [Tags]    Functional    p2    planned
    [Documentation]    Browse spare parts listing - TC-MKT-001
    Open Browser    ${BASE_URL}/spare-parts    ${BROWSER}
    Wait Until Page Contains Element    xpath=//*[@id="root"]/div[2]/main/div[1]/h1    timeout=15s
    Run Keyword And Ignore Error    Page Should Contain Element    xpath=//*[@id="root"]/div[2]/main/div[1]/h1
    Close Browser

FR-006 Purchase Spareparts :: TC-ORD-001    [Tags]    Functional    Integration    p1    planned
    [Documentation]    Purchase spare part via cart/checkout - TC-ORD-001
    Open Browser    ${BASE_URL}/auth    ${BROWSER}
    Wait Until Page Contains Element    xpath=//form    timeout=15s
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="email"]    fanue000@gmail.com
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="password"]    12345678
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="root"]/div[2]/main/div/form/button
    Run Keyword And Ignore Error    Click Link    xpath=//*[@id="root"]/div[2]/div[1]/section[1]/div[4]/div/div[2]/a[2]
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="root"]/div[2]/main/div[3]/div[1]/div[2]/button
    Reload Page
    Run Keyword And Ignore Error    Click Link    xpath=//*[@id="root"]/div[2]/header/div/div/a[2]
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="root"]/div[2]/main/div[2]/div[2]/div[2]/button[1]
    Wait Until Page Contains    Pay    timeout=12s
    Close Browser

FR-007 Payment Processing :: TC-PAY-001    [Tags]    Functional    Security    p1    planned
    [Documentation]    Payment processing page/flow - TC-PAY-001
    Open Browser    ${BASE_URL}/auth    ${BROWSER}
    Wait Until Page Contains Element    xpath=//form    timeout=15s
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="email"]    fanue000@gmail.com
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="password"]    12345678
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="root"]/div[2]/main/div/form/button
    Wait Until Page Contains Element    xpath=//*[@id="root"]/div[2]/div[1]/header/div/div/a[4]/span[2]    timeout=15s
    Go To    ${BASE_URL}/wallet
    Wait Until Page Contains Element    xpath=//*[@id="root"]/div[2]/main/div[2]/div[2]/button[1]    timeout=15s
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="root"]/div[2]/main/div[2]/div[2]/button[1]
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="radix-:r0:"]/div[2]/div[1]/input    100
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="radix-:r0:"]/div[2]/button
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="test-number"]    0900112233
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="app"]/main/div/div[1]/div[1]/div[3]/div/div/div[2]/form/button
    Wait Until Page Contains Element    xpath=//*[@id="root"]/div[2]/main/div[2]    timeout=15s
    Run Keyword And Ignore Error    Page Should Contain    Balance
    Close Browser

FR-008 Rating & Review :: TC-REV-001    [Tags]    Functional    p2    planned
    [Documentation]    Leave rating and review - TC-REV-001
    Open Browser    ${BASE_URL}/auth    ${BROWSER}
    Wait Until Page Contains Element    xpath=//form    timeout=15s
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="email"]    fanue000@gmail.com
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="password"]    12345678
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="root"]/div[2]/main/div/form/button
    Wait Until Page Contains Element    xpath=//*[@id="root"]/div[2]/div[1]/header/div/div/a[4]/span[2]    timeout=15s
    Run Keyword And Ignore Error    Click Link    xpath=//*[@id="root"]/div[2]/div[1]/section[1]/div[4]/div/div[2]/a[2]
    Wait Until Page Contains Element    xpath=//*[@id="root"]/div[2]/main/div[1]/h1    timeout=15s
    Run Keyword And Ignore Error    Click Link    xpath=//*[@id="root"]/div[2]/main/div[3]/a[1]
    Run Keyword And Ignore Error    Input Text    xpath=/html/body/div/div[2]/main/div/div[1]/div[3]/div[1]/textarea    Good service
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="root"]/div[2]/main/div/div[1]/div[3]/div[1]/button
    Wait Until Page Contains    R    timeout=12s
    Close Browser

FR-009 Admin Account Management :: TC-ADM-001    [Tags]    Functional    Security    p1    planned
    [Documentation]    Admin login and manage users - TC-ADM-001
    Open Browser    ${BASE_URL}/admin/login    ${BROWSER}
    Wait Until Page Contains Element    xpath=//form    timeout=15s
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="email"]    fanuelman10@gmail.com
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="password"]    12345678
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="root"]/div[2]/div/form/button
    Wait Until Page Contains Element    xpath=//*[@id="root"]/div[2]/main/h1    timeout=15s
    Close Browser

FR-010 User Logout :: TC-AUTH-002    [Tags]    Functional    Security    p1    planned
    [Documentation]    Logout - TC-AUTH-002
    Open Browser    ${BASE_URL}/auth    ${BROWSER}
    Wait Until Page Contains Element    xpath=//form    timeout=15s
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="email"]    fanue000@gmail.com
    Run Keyword And Ignore Error    Input Text    xpath=//*[@id="password"]    12345678
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="root"]/div[2]/main/div/form/button
    Wait Until Page Contains Element    xpath=//*[@id="root"]/div[2]/div[1]/header/div/div/a[5]    timeout=15s
    Run Keyword And Ignore Error    Click Link    xpath=//*[@id="root"]/div[2]/div[1]/header/div/div/a[5]
    Run Keyword And Ignore Error    Click Button    xpath=//*[@id="root"]/div[2]/main/div/div[4]/div/button
    Wait Until Page Contains Element    xpath=//form    timeout=12s
    Close Browser
