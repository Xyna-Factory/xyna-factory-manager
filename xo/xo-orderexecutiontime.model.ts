// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty } from '@zeta/api';
import { isString } from '@zeta/base';

import { XoTimeWindow } from './xo-timewindow.model';


@XoObjectClass(null, 'xmcp.factorymanager.shared', 'OrderExecutionTime')
export class XoOrderExecutionTime extends XoObject {

    @XoProperty()
    timezone: string;

    @XoProperty()
    startTime: number;

    @XoProperty()
    considerDST: boolean;

    @XoProperty(XoTimeWindow)
    timeWindow: XoTimeWindow = new XoTimeWindow();

    @XoProperty()
    endTime: number;


    afterDecode() {
        // TODO: conversion related to FMAN-288 caused by XBE-254. Remove once ZETA-160 is fixed!
        if (isString(this.startTime)) {
            this.startTime = +this.startTime;
        }
        if (isString(this.endTime)) {
            this.endTime = +this.endTime;
        }
    }
}


@XoArrayClass(XoOrderExecutionTime)
export class XoOrderExecutionTimeArray extends XoArray<XoOrderExecutionTime> {
}
