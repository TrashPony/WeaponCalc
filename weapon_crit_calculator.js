define([
        'jquery',
        "text!./css/style.css",
    ],
    function ($, cssContent) {
        'use strict';

        $('<style>').html(cssContent).appendTo('head');

        return {
            definition: {
                type: "items",
                component: "accordion",
                items: {
                    appearancePanel: {
                        uses: "settings",
                        items: {
                            dimensions: {
                                uses: "dimensions",
                                min: 2,
                                max: 2
                            },

                            measures: {
                                uses: "measures",
                                min: 4,
                                max: 4
                            },
                        }
                    }
                }
            },
            initialProperties: {
                version: 1.0,
                qHyperCubeDef: {
                    qDimensions: [],
                    qMeasures: [],
                    qInitialDataFetch: [{
                        qWidth: 20,
                        qHeight: 50
                    }]
                }
            },
            paint: function ($element, layout) {
                let qMatrix = layout.qHyperCube.qDataPages[0].qMatrix;
                console.log(layout);

                // layout.qHyperCube.qDimensionInfo: dimensions used
                // layout.qHyperCube.qMeasureInfo: measures used
                // layout.qHyperCube.qDataPages: the result

                // у оружия может быть много разных боеприпасов влияющих на его характиристики
                // - найти максимальные значения для всех характирисмтик которые будут 100% для шкалы.
                // 1 селект для выбора оружия
                // 2 селект для выбора боеприпаса к нему
                // 3 вывод информации в виде графика по характиристикам критической атаки

                $element.html(
                    `
                    <div id="weaponCalcWrapper">
                        <label> Выберите оружие: <select id="ChoiceWeapon"><option>-</option></select></label>
                        <label> Выберите снаряд: <select id="ChoiceAmmo" disabled><option>-</option></select></label>
                    </div>
                    
                    <div id="weaponCritResult">
                    </div>
                    `
                );

                let weaponOptions = getWeaponNames(qMatrix);
                let choiceWeaponSelect = $('#ChoiceWeapon');

                for (let weaponName of weaponOptions) {
                    choiceWeaponSelect.html(choiceWeaponSelect.html() + `<option value="${weaponName}">${weaponName}</option>`)
                }

                choiceWeaponSelect.change(function () {
                    changeWeapon(this.value, qMatrix)
                })
            }
        };
    }
);

function changeWeapon(choiceWeaponName, qMatrix) {
    let choiceAmmoSelect = $('#ChoiceAmmo');
    choiceAmmoSelect.html(`<option>-</option>`);
    $('#weaponCritResult').empty();

    if (this.value === '-') {
        choiceAmmoSelect.prop("disabled", true);
        return
    }

    let ammoOptions = GetAmmoNamesByWeaponName(qMatrix, choiceWeaponName);
    choiceAmmoSelect.prop("disabled", false);

    for (let ammoName of ammoOptions) {
        choiceAmmoSelect.html(choiceAmmoSelect.html() + `<option value="${ammoName}">${ammoName}</option>`)
    }

    choiceAmmoSelect.change(function () {
        changeAmmo(choiceWeaponName, this.value, qMatrix)
    })
}

function changeAmmo(choiceWeaponName, choiceAmmoName, qMatrix) {
    let weaponCritResult = $('#weaponCritResult');

    if (choiceAmmoName === '-') {
        weaponCritResult.empty();
        return
    }

    const maxDamage = function () {
        let maxDamage = 0;

        for (let state of qMatrix) {
            let damage = Number(state[4].qText.replace(",", ".")) + Number(state[5].qText.replace(",", "."));
            if (damage > maxDamage) {
                maxDamage = damage;
            }
        }

        return maxDamage
    };

    for (let state of qMatrix) {
        if (state[0].qText === choiceWeaponName && state[1].qText === choiceAmmoName) {

            let chanceCrit = Number(state[2].qText.replace(",", ".")) + Number(state[3].qText.replace(",", "."));

            let currentDamage = Number(state[4].qText.replace(",", ".")) + Number(state[5].qText.replace(",", "."));
            let percentDamage = (currentDamage * 100) / maxDamage();

            weaponCritResult.html(`
                <div>
                    <h3>Шанс критического урона ${chanceCrit}%</h3>
                    <div class="line" style="background: #0bb68d; width: ${chanceCrit}%">
                        <div class="tip">weapon: ${Number(state[2].qText.replace(",", "."))}, ammo: ${Number(state[3].qText.replace(",", "."))}</div>
                    </div>
                </div>
                <div>
                    <h3>Урон по снаряжению ${currentDamage}</h3>
                    <div class="line" style="background: #b60000; width: ${percentDamage}%">
                        <div class="tip">weapon: ${Number(state[4].qText.replace(",", "."))}, ammo: ${Number(state[5].qText.replace(",", "."))}</div>
                    </div>
                </div>
            `);
        }
    }
}

function getWeaponNames(qMatrix) {
    let weapons = [];

    // 0 - оружие
    // 1 - снаряд

    for (let state of qMatrix) {
        if (weapons.indexOf(state[0].qText) === -1) {
            weapons.push(state[0].qText);
        }
    }

    return weapons
}

function GetAmmoNamesByWeaponName(qMatrix, weaponName) {
    let ammo = [];
    // находим все снаряды которые имеют общие данные с выбраным оружием.
    for (let state of qMatrix) {
        if (state[0].qText === weaponName && ammo.indexOf(state[1].qText) === -1) {
            ammo.push(state[1].qText);
        }
    }

    return ammo
}